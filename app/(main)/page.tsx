// app/(main)/page.tsx
// This is a Server Component by default, perfect for a static public homepage.
// No 'use client' needed here unless you add interactive client-side elements.

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 text-center'>
      <div className='bg-white p-10 rounded-lg shadow-2xl max-w-2xl w-full'>
        <h1 className='text-5xl font-extrabold text-gray-900 mb-6 leading-tight'>
          Welcome to <span className='text-indigo-600'>LeadFlow Pro</span>
        </h1>
        <p className='text-xl text-gray-700 mb-8 max-w-prose mx-auto'>
          Your ultimate solution for effortless lead management and advanced
          skip-tracing to connect with homeowners.
        </p>
        <div className='flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
          <Link href='/signup' className='w-full sm:w-auto'>
            <button className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg'>
              Get Started Free
            </button>
          </Link>
          <Link href='/signin' className='w-full sm:w-auto'>
            <button className='bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md'>
              Login
            </button>
          </Link>
        </div>
      </div>
      <footer className='mt-12 text-gray-600 text-sm'>
        &copy; {new Date().getFullYear()} LeadFlow Pro. All rights reserved.
      </footer>
    </div>
  );
}
