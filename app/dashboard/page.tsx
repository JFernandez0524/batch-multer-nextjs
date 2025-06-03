// app/dashboard/page.tsx
'use client'; // This is a client component as it uses React hooks (useEffect, useRouter, useAuth)

import { useEffect } from 'react';
import { useAuth } from '../../components/AuthContext'; // Adjust path based on your AuthContext location
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import Link from 'next/link'; // Next.js Link component

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Effect hook to handle authentication redirection
  useEffect(() => {
    // If not loading and no user is authenticated, redirect to the sign-in page
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]); // Dependencies: re-run effect if user, loading, or router change

  // Show a loading state while authentication status is being determined
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <p className='text-gray-700 text-lg'>Loading dashboard...</p>
      </div>
    );
  }

  // If user is not authenticated (and not loading), they'll be redirected by the useEffect.
  // This render block will only be reached if user is authenticated.
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
      <div className='bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full'>
        {user ? ( // Only render if user is available (already checked by useEffect but good for clarity)
          <>
            <h1 className='text-4xl font-bold text-gray-800 mb-4'>
              Welcome, {user.email?.split('@')[0]}!{' '}
              {/* Display part of email before @ */}
            </h1>
            <p className='text-lg text-gray-600 mb-6'>
              This is your secure lead management dashboard.
            </p>

            <div className='flex flex-col space-y-4 mb-6'>
              <Link href='/upload-leads' className='w-full'>
                <button className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full shadow-md'>
                  Upload New Leads
                </button>
              </Link>
              <Link href='/my-leads' className='w-full'>
                <button className='bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out w-full shadow-md'>
                  View My Leads
                </button>
              </Link>
            </div>

            <button
              onClick={logout}
              className='mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-lg transition duration-300 ease-in-out shadow-sm'
            >
              Sign Out
            </button>
          </>
        ) : null}{' '}
        {/* If user is null after loading, nothing renders here as they're redirected */}
      </div>
    </div>
  );
}
