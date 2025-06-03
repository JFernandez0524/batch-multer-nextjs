// functions/src/index.ts

// Explicitly import v2 Firestore trigger functions
import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';

// Modular firebase-admin imports for tree-shaking benefits
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

import axios from 'axios'; // Import axios for making HTTP requests

// Initialize Firebase Admin SDK
// In Cloud Functions, initializeApp does not need the admin.apps.length check
const adminApp = initializeApp({
  credential: applicationDefault(), // Authenticates using Google Application Default Credentials
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`, // From .env
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // From .env
});
const db = getFirestore(adminApp); // Get the Firestore instance

// Define the TypeScript interface for your lead data
interface LeadData {
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  userId: string;
  uploadedAt: Timestamp;
  phoneNumber: string | null;
  status:
    | 'Processing'
    | 'Completed'
    | 'Skiptrace Failed'
    | 'Malformed Data'
    | 'Pending AI Analysis'
    | 'Analyzed';
  error?: string;
  aiAnalysis?: string;
  analyzedAt?: Timestamp;
}

// Interface for BatchData API Response
interface BatchDataApiResponse {
  status: {
    code: number;
    text: string;
  };
  results: {
    persons: Array<{
      _id: string;
      dnc: Record<string, any>;
      emails?: Array<{ email: string }>;
      name: { first: string; last: string };
      phoneNumbers?: Array<{
        number: string;
        carrier: string;
        type: 'Mobile' | 'Land Line';
        tested: boolean;
        reachable: boolean;
        score: number;
      }>;
      propertyAddress?: Record<string, any>;
      litigator?: boolean;
    }>;
    meta?: {
      results?: {
        requestCount: number;
        matchCount: number;
        noMatchCount: number;
        errorCount: number;
      };
    };
  };
}

// --- Configuration for External APIs ---
const BATCHDATA_API_ENDPOINT = process.env.BATCHDATA_API_ENDPOINT;
const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY;
const VERTEXAI_ENDPOINT_ID = process.env.VERTEXAI_ENDPOINT_ID;
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;

// --- Cloud Function 1: Process New Leads for Skiptracing ---
exports.processNewLeadForSkiptrace = onDocumentCreated(
  'users/{userId}/leads/{leadId}', // Firestore v2 trigger path
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('[Skiptrace Trigger] No data in event.data. Skipping.');
      return null;
    }
    const leadData = snap.data() as LeadData;
    const { userId, leadId } = event.params;

    console.log(
      `[Skiptrace Trigger] New lead created for user ${userId}, ` +
        `lead ID: ${leadId}.`
    );
    console.log('Lead Data Received:', leadData);

    if (
      leadData.status !== 'Processing' ||
      !leadData.firstName ||
      !leadData.lastName ||
      !leadData.streetAddress ||
      !leadData.city ||
      !leadData.state ||
      !leadData.postalCode
    ) {
      console.warn(
        `[Skiptrace Trigger] Lead ${leadId} not in 'Processing' ` +
          `status or missing critical data. Skipping.`
      );
      if (leadData.status === 'Processing') {
        await db
          .collection('users')
          .doc(userId)
          .collection('leads')
          .doc(leadId)
          .update({
            status: 'Malformed Data',
            error: 'Missing required lead fields for skiptrace.',
          });
      }
      return null;
    }

    if (!BATCHDATA_API_ENDPOINT || !BATCHDATA_API_KEY) {
      console.error(
        `[Skiptrace Trigger] BatchData API endpoint (` +
          `${BATCHDATA_API_ENDPOINT}) or key not configured in .env. ` +
          `Cannot perform skiptrace for lead ${leadId}.`
      );
      await db
        .collection('users')
        .doc(userId)
        .collection('leads')
        .doc(leadId)
        .update({
          status: 'Skiptrace Failed',
          error: 'Skiptrace API credentials missing in Cloud Function .env.',
        });
      return null;
    }

    try {
      const fullName = `${leadData.firstName} ${leadData.lastName}`.trim();
      console.log(
        `[Skiptrace Trigger] Calling BatchData API for: "${fullName}", ` +
          `${leadData.streetAddress}, ${leadData.city}, ${leadData.state}, ` +
          `${leadData.postalCode}`
      );

      const requestBody = {
        requests: [
          {
            propertyAddress: {
              city: leadData.city,
              street: leadData.streetAddress,
              state: leadData.state,
              zip: leadData.postalCode,
            },
          },
        ],
      };

      const requestHeaders = {
        Authorization: BATCHDATA_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json, application/xml',
      };

      const { data: apiData } = await axios.post<BatchDataApiResponse>(
        BATCHDATA_API_ENDPOINT as string,
        requestBody,
        { headers: requestHeaders }
      );

      let cellPhoneNumber: string | null = null;
      let skiptraceMessage: string | null = null;

      if (
        apiData.results &&
        apiData.results.persons &&
        apiData.results.persons.length > 0
      ) {
        const personResult = apiData.results.persons[0];

        const isDnc =
          personResult.dnc && Object.keys(personResult.dnc).length > 0;

        if (isDnc) {
          skiptraceMessage =
            'Person is on DNC list. Skipping phone number extraction.';
          console.log(
            `[Skiptrace Trigger] ${fullName} is on DNC list. No phone ` +
              `number will be extracted.`
          );
        } else {
          const mobilePhoneNumbers = (personResult.phoneNumbers || []).filter(
            (p: any) => p.type === 'Mobile'
          );

          if (mobilePhoneNumbers.length > 0) {
            const bestMobile =
              mobilePhoneNumbers.find(
                (p: any) => p.tested === true && p.reachable === true
              ) || mobilePhoneNumbers.find((p: any) => p.number);

            if (bestMobile) {
              cellPhoneNumber = bestMobile.number;
              skiptraceMessage =
                `Mobile (${bestMobile.type}, Score: ` +
                `${bestMobile.score || 'N/A'}${
                  bestMobile.tested ? ', Tested' : ''
                }` +
                `${bestMobile.reachable ? ', Reachable' : ''})`;
            }
          }

          if (!cellPhoneNumber) {
            skiptraceMessage =
              'No suitable mobile phone number found for this ' +
              'lead (not on DNC).';
          }
        }
      } else {
        const noMatchCount = apiData.results?.meta?.results?.noMatchCount ?? 0;
        skiptraceMessage =
          noMatchCount > 0
            ? 'No match found for address by ' + 'BatchData.'
            : 'API response missing person ' + 'results or other issue.';
      }

      console.log(
        `[Skiptrace Trigger] Skiptrace result for ${fullName}: ` +
          `Phone Number - ${cellPhoneNumber || 'Not found'}. ` +
          `Message: ${skiptraceMessage}`
      );
      console.log(
        'BatchData API Full Response (for debugging):',
        JSON.stringify(apiData, null, 2)
      );

      await db
        .collection('users')
        .doc(userId)
        .collection('leads')
        .doc(leadId)
        .update({
          phoneNumber: cellPhoneNumber,
          status: cellPhoneNumber ? 'Completed' : 'Skiptrace Failed',
          error: cellPhoneNumber ? FieldValue.delete() : skiptraceMessage,
        });
    } catch (axiosError: any) {
      console.error(
        `[Skiptrace Trigger] Error calling BatchData API for lead ` +
          `${leadId}:`
      );
      if (axiosError.response) {
        console.error('Axios Response Data:', axiosError.response.data);
        console.error('Axios Response Status:', axiosError.response.status);
        console.error('Axios Response Headers:', axiosError.response.headers);
        await db
          .collection('users')
          .doc(userId)
          .collection('leads')
          .doc(leadId)
          .update({
            status: 'Skiptrace Failed',
            phoneNumber: null,
            error:
              `API Error ${axiosError.response.status}: ` +
              `${axiosError.response.data?.message || axiosError.message}`,
          });
      } else if (axiosError.request) {
        console.error('Axios Request Error (No response):', axiosError.request);
        await db
          .collection('users')
          .doc(userId)
          .collection('leads')
          .doc(leadId)
          .update({
            status: 'Skiptrace Failed',
            phoneNumber: null,
            error: `API Request Error: No response received. ${axiosError.message}`,
          });
      } else {
        console.error('Axios Config Error:', axiosError.message);
        await db
          .collection('users')
          .doc(userId)
          .collection('leads')
          .doc(leadId)
          .update({
            status: 'Skiptrace Failed',
            phoneNumber: null,
            error: `API Config Error: ${axiosError.message}`,
          });
      }
    }
    return null;
  }
);

// --- Cloud Function 2: Analyze Leads with Vertex AI ---
exports.analyzeLeadsWithVertexAI = onDocumentUpdated(
  'users/{userId}/leads/{leadId}',
  async (event) => {
    const change = event.data;
    if (!change) {
      console.log(
        `[Vertex AI Trigger] No data in event.data for lead ` +
          `${event.params.leadId}. Skipping.`
      );
      return null;
    }
    const newValue = change.after.data() as LeadData | undefined;
    const previousValue = change.before.data() as LeadData | undefined;
    const { userId, leadId } = event.params;

    if (!newValue) {
      console.log(
        `[Vertex AI Trigger] No new value for lead ${leadId}. Skipping.`
      );
      return null;
    }

    if (
      newValue.phoneNumber &&
      newValue.status === 'Completed' &&
      ((!previousValue?.aiAnalysis && newValue.aiAnalysis === undefined) ||
        previousValue?.phoneNumber !== newValue.phoneNumber ||
        (newValue.status === 'Completed' &&
          previousValue?.status !== 'Completed'))
    ) {
      console.log(
        `[Vertex AI Trigger] Initiating Vertex AI analysis for lead ` +
          `${leadId} of user ${userId}.`
      );

      if (!VERTEXAI_ENDPOINT_ID || !GCP_PROJECT_ID) {
        console.error(
          `[Vertex AI Trigger] Vertex AI endpoint ID ` +
            `(${VERTEXAI_ENDPOINT_ID}) or GCP Project ID ` +
            `(${GCP_PROJECT_ID}) not configured in .env. Skipping ` +
            `analysis for lead ${leadId}.`
        );
        await db
          .collection('users')
          .doc(userId)
          .collection('leads')
          .doc(leadId)
          .update({
            aiAnalysisError: 'Vertex AI config missing in Cloud Function .env.',
          });
        return null;
      }

      try {
        const predictionResult =
          `AI analysis for ${newValue.firstName} ` +
          `${newValue.lastName}: (Simulated Result) - ` +
          `Score 85/100, Good prospect based on mobile ` +
          `phone availability and address.`;

        console.log(
          '[Vertex AI Trigger] Vertex AI prediction (simulated):',
          predictionResult
        );

        await db
          .collection('users')
          .doc(userId)
          .collection('leads')
          .doc(leadId)
          .update({
            aiAnalysis: predictionResult,
            analyzedAt: FieldValue.serverTimestamp(),
            status: 'Analyzed',
            aiAnalysisError: FieldValue.delete(),
          });
      } catch (aiError: any) {
        console.error(
          `[Vertex AI Trigger] Error with Vertex AI analysis for ` +
            `lead ${leadId}:`,
          aiError.message
        );
        await db
          .collection('users')
          .doc(userId)
          .collection('leads')
          .doc(leadId)
          .update({
            aiAnalysisError: aiError.message,
            status: 'Completed',
          });
      }
    } else {
      // console.log(`[Vertex AI Trigger] Skipping analysis for lead ${leadId} (conditions not met).`);
    }
    return null;
  }
);
