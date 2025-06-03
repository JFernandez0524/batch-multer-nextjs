// app/signup/page.tsx
'use client'; // This directive makes this a Client Component, allowing use of hooks like useState, useEffect, useRouter, and useAuth.

import { useState } from 'react'; // For managing component state (email, password, error)
import { useRouter } from 'next/navigation'; // For programmatic navigation in the App Router
import Link from 'next/link'; // For client-side navigation to other pages

import { useAuth } from '../../components/AuthContext'; // Adjust this import path based on your AuthContext.tsx location.
// If you have `baseUrl: "."` in tsconfig.json, you can use 'components/AuthContext'.

export default function SignupPage() {
  // State variables for email, password, and error messages
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // To show loading state during sign-up process

  // Access authentication functions from the AuthContext
  const { signup, signInWithGoogle } = useAuth();
  const router = useRouter(); // Initialize router for navigation

  // Handler for email/password form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setError(''); // Clear any previous errors
    setLoading(true); // Set loading state to true

    try {
      await signup(email, password); // Call the sign-up function from AuthContext
      router.push('/dashboard'); // Redirect to the dashboard page upon successful sign-up
    } catch (err: any) {
      // Catch any errors during the sign-up process
      console.error('Sign-up error:', err);
      // Display a user-friendly error message based on Firebase error codes
      if (err.code === 'auth/email-already-in-use') {
        setError(
          'This email address is already in use. Please sign in or use a different email.'
        );
      } else if (err.code === 'auth/weak-password') {
        setError(
          'Password is too weak. Please choose a stronger password (at least 6 characters).'
        );
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Handler for Google Sign-Up (same as sign-in, as Firebase handles creation if user doesn't exist)
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle(); // Call the Google sign-in function from AuthContext
      router.push('/dashboard'); // Redirect to the dashboard page upon successful Google sign-up
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      setError(
        err.message || 'Failed to sign up with Google. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
      <div className='bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full'>
        <h1 className='text-4xl font-bold text-gray-800 mb-6'>Sign Up</h1>

        {/* Error message display */}
        {error && (
          <p className='text-red-600 bg-red-100 border border-red-200 p-3 rounded-md mb-4 text-sm'>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label
              htmlFor='email'
              className='block text-left text-gray-700 text-sm font-medium mb-1'
            >
              Email Address
            </label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
              placeholder='you@example.com'
            />
          </div>
          <div>
            <label
              htmlFor='password'
              className='block text-left text-gray-700 text-sm font-medium mb-1'
            >
              Password
            </label>
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
              placeholder='•••••••• (min 6 characters)'
            />
          </div>
          <button
            type='submit'
            disabled={loading} // Disable button when loading
            className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className='mt-6 flex items-center justify-between text-gray-500'>
          <hr className='w-5/12 border-gray-300' />
          <span className='text-sm'>OR</span>
          <hr className='w-5/12 border-gray-300' />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className='mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? 'Signing Up...' : 'Sign Up with Google'}
        </button>

        <p className='mt-6 text-sm text-gray-600'>
          Already have an account?{' '}
          <Link
            href='/signin'
            className='text-blue-600 hover:text-blue-800 font-medium'
          >
            Sign In
          </Link>
        </p>
        <p className='mt-2 text-sm text-gray-600'>
          <Link href='/' className='text-gray-500 hover:text-gray-700'>
            Go back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
