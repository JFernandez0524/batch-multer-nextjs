// app/api/v1/upload-csv/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse';
import { adminDb } from '../../../../lib/firebaseAdmin'; // Adjust path if needed
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// --- UPDATED CsvRow INTERFACE ---
// Now expects 'First Name' and 'Last Name' columns directly
interface CsvRow {
  'First Name': string; // Changed from 'Name'
  'Last Name': string; // New required column
  'Street Address': string;
  City: string;
  State: string;
  'Postal Code': string;
  [key: string]: string; // Allows for other unexpected columns
}

interface LeadDocument {
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  userId: string;
  uploadedAt: admin.firestore.FieldValue;
  phoneNumber: string | null;
  status: 'Processing' | 'Completed' | 'Skiptrace Failed' | 'Malformed Data';
}

// GET handler (for testing the route's accessibility)
export async function GET(request: NextRequest) {
  console.log('GET request received for /api/v1/upload-csv');
  return NextResponse.json({ status: 200, message: 'API route is working!' });
}

// POST handler (for handling CSV file uploads)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get('csvFile') as Blob | null;
    const userId = formData.get('userId') as string | null;

    if (!csvFile) {
      return NextResponse.json(
        { error: 'No CSV file uploaded.' },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID missing.' },
        { status: 401 }
      );
    }

    const csvText = await csvFile.text();
    const leads: LeadDocument[] = [];

    await new Promise<void>((resolve, reject) => {
      parse(
        csvText,
        {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        },
        (err, records: CsvRow[]) => {
          if (err) {
            console.error('Error parsing CSV:', err);
            return reject(
              new Error(
                'Failed to parse CSV file. Please ensure it is a valid CSV.'
              )
            );
          }

          for (const row of records) {
            // --- UPDATED: Directly extract First Name and Last Name ---
            const firstName =
              row['First Name'] || row.first_name || row.firstName || '';
            const lastName =
              row['Last Name'] || row.last_name || row.lastName || '';

            const streetAddress =
              row['Street Address'] ||
              row.street_address ||
              row.streetAddress ||
              '';
            const city = row.City || row.city || '';
            const state = row.State || row.state || '';
            const postalCode =
              row['Postal Code'] || row.postal_code || row.postalCode || '';

            // --- UPDATED VALIDATION ---
            // Now checking for both firstName and lastName explicitly
            if (
              firstName &&
              lastName &&
              streetAddress &&
              city &&
              state &&
              postalCode
            ) {
              const leadData: LeadDocument = {
                firstName,
                lastName,
                streetAddress,
                city,
                state,
                postalCode,
                userId: userId,
                uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
                phoneNumber: null,
                status: 'Processing',
              };
              leads.push(leadData);
            } else {
              console.warn(
                'Skipping malformed row due to missing data (First Name, Last Name, or Address fields):',
                JSON.stringify(row)
              );
            }
          }
          resolve();
        }
      );
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { message: 'No valid leads found in CSV file after parsing.' },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();
    const userLeadsCollectionRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('leads');

    for (const lead of leads) {
      const newLeadRef = userLeadsCollectionRef.doc();
      batch.set(newLeadRef, lead);
    }

    await batch.commit();
    console.log(
      `Successfully saved ${leads.length} leads to Firestore for user ${userId}.`
    );

    return NextResponse.json(
      {
        message:
          'CSV file processed and leads saved. Skip-tracing will begin shortly.',
        leadsCount: leads.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in API route /api/v1/upload-csv:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
