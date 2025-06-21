// app/my-leads/page.tsx
'use client'; // This is a Client Component as it uses React hooks and Firebase client SDKs

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext'; // Path from app/my-leads to components/AuthContext
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import client-side Firebase Firestore functions and Timestamp type
import {
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from 'utils/firebaseConfig'; // <-- CORRECTED PATH: from root utils/firebaseConfig

// Define the type for a lead document retrieved from Firestore
interface Lead {
  id: string; // Firestore document ID
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string | null;
  status:
    | 'Processing'
    | 'Completed'
    | 'Skiptrace Failed'
    | 'Malformed Data'
    | 'Pending AI Analysis'
    | 'Analyzed'
    | 'Pending Zillow'
    | 'Zillow Failed'
    | 'Unknown'; // Updated statuses
  uploadedAt: Timestamp; // Firestore Timestamp type
  error?: string; // Optional error message from skiptrace
  aiAnalysis?: string; // Optional field for Vertex AI analysis
  analyzedAt?: Timestamp; // Optional timestamp for AI analysis
  zestimate?: number | null; // Zillow's estimated value
  latitude?: number | null; // Property latitude
  longitude?: number | null; // Property longitude
  zillowApiStatus?: 'Pending' | 'Success' | 'Failed' | 'N/A'; // Status of Zillow API call
  zillowApiError?: string; // Error message from Zillow API call
}

export default function MyLeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [fetchLoading, setFetchLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Effect hook to protect the route: redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  // Effect hook to fetch leads when the user is authenticated
  useEffect(() => {
    const fetchLeads = async () => {
      if (!user) {
        setFetchLoading(false); // Stop loading if no user (will redirect)
        return;
      }

      setFetchLoading(true);
      setError('');
      try {
        // Query for leads belonging to the current user, ordered by upload time
        const leadsCollectionRef = collection(db, `users/${user.uid}/leads`);
        const q = query(leadsCollectionRef, orderBy('uploadedAt', 'desc'));

        console.log(`Fetching leads for user: ${user.uid}`);
        const querySnapshot = await getDocs(q);

        const fetchedLeads: Lead[] = [];
        querySnapshot.forEach((doc) => {
          fetchedLeads.push({ id: doc.id, ...doc.data() } as Lead); // Cast to Lead type
        });
        setLeads(fetchedLeads);
        console.log(`Found ${fetchedLeads.length} leads for user ${user.uid}.`);
      } catch (err: any) {
        console.error('Error fetching leads:', err);
        setError(`Failed to fetch leads: ${err.message}. Please try again.`);
      } finally {
        setFetchLoading(false);
      }
    };

    // Only fetch leads if the user object is available (i.e., authenticated)
    if (user) {
      fetchLeads();
    }
  }, [user]); // Dependency on 'user' ensures fetch is attempted once user is loaded

  // Show loading state for authentication or data fetching
  if (authLoading || fetchLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <p className='text-gray-700 text-lg'>Loading leads...</p>
      </div>
    );
  }

  // Display error message if fetching failed
  if (error) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full'>
          <p className='text-red-600 bg-red-100 border border-red-200 p-4 rounded-md mb-6'>
            {error}
          </p>
          <Link
            href='/dashboard'
            className='text-gray-500 hover:text-gray-700 font-medium'
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center p-4'>
      <div className='bg-white p-8 rounded-lg shadow-xl max-w-5xl w-full mt-8 mb-8'>
        <h1 className='text-4xl font-bold text-gray-800 mb-6 text-center'>
          My Uploaded Leads
        </h1>

        {leads.length === 0 ? (
          <p className='text-lg text-gray-600 text-center'>
            No leads uploaded yet.{' '}
            <Link
              href='/upload-leads'
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              Upload some!
            </Link>
          </p>
        ) : (
          <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-100'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    First Name
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Last Name
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Street Address
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    City
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    State
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Postal Code
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Phone Number
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Status
                  </th>
                  {/* --- NEW HEADERS FOR ZILLOW DATA --- */}
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Zestimate
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Location
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Uploaded At
                  </th>
                  <th
                    scope='col'
                    className='col-span-2 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    AI Analysis
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {lead.firstName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.lastName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.streetAddress}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.city}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.state}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.postalCode}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold'>
                      {lead.phoneNumber || 'N/A (Processing)'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : lead.status === 'Analyzed'
                            ? 'bg-blue-100 text-blue-800'
                            : lead.status === 'Processing' ||
                              lead.status === 'Pending Zillow'
                            ? 'bg-yellow-100 text-yellow-800' // Combine processing states
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {lead.status}
                      </span>
                      {lead.error && (
                        <p className='text-xs text-red-500 mt-1 truncate max-w-[150px]'>
                          {lead.error}
                        </p>
                      )}
                      {lead.zillowApiError && (
                        <p className='text-xs text-red-500 mt-1 truncate max-w-[150px]'>
                          Zillow: {lead.zillowApiError}
                        </p>
                      )}
                    </td>
                    {/* --- NEW CELLS FOR ZILLOW DATA --- */}
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.zestimate
                        ? `$${lead.zestimate.toLocaleString()}`
                        : lead.zillowApiStatus === 'Failed'
                        ? 'N/A'
                        : 'Pending'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.latitude && lead.longitude ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=<span class="math-inline">\{lead\.latitude\},</span>{lead.longitude}`} // Corrected Google Maps URL
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:text-blue-800 underline'
                          title={`Lat: ${lead.latitude}, Lng: ${lead.longitude}`}
                        >
                          View Map
                        </a>
                      ) : lead.zillowApiStatus === 'Failed' ? (
                        'N/A'
                      ) : (
                        'Pending'
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {lead.uploadedAt?.toDate().toLocaleString() || 'N/A'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500 max-w-xs truncate'>
                      {lead.aiAnalysis ||
                        (lead.status === 'Completed' ||
                        lead.status === 'Pending Zillow'
                          ? 'Pending AI Analysis'
                          : 'N/A')}
                      {lead.analyzedAt && (
                        <p className='text-xs text-gray-400 mt-1'>
                          ({lead.analyzedAt.toDate().toLocaleString()})
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className='mt-8 text-sm text-gray-600 text-center'>
          <Link
            href='/dashboard'
            className='text-gray-500 hover:text-gray-700 font-medium'
          >
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
