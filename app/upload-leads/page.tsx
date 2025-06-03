// app/upload-leads/page.tsx
'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../components/AuthContext'; // Adjust path if needed
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadLeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>(
    'info'
  );
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setMessage('Please select a valid CSV file.');
        setMessageType('error');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setMessage(`Selected file: ${file.name}`);
      setMessageType('info');
    } else {
      setSelectedFile(null);
      setMessage('');
      setMessageType('info');
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a CSV file to upload.');
      setMessageType('error');
      return;
    }

    if (!user) {
      setMessage('You must be logged in to upload leads.');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage(
      'Uploading file... Please wait. This may take a moment for large files.'
    );
    setMessageType('info');

    const formData = new FormData();
    formData.append('csvFile', selectedFile);
    formData.append('userId', user.uid);

    try {
      const response = await fetch('/api/v1/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `Success: ${
            data.message || 'CSV file uploaded and processing initiated.'
          }`
        );
        setMessageType('success');
        setSelectedFile(null);
        const fileInput = document.getElementById(
          'csv-file-input'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage(
          `Error: ${data.error || 'Something went wrong during upload.'}`
        );
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setMessage(
        `An unexpected error occurred during upload: ${error.message}. Please try again.`
      );
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <p className='text-gray-700 text-lg'>Loading...</p>
      </div>
    );
  }

  const messageClasses = {
    success: 'bg-green-100 border-green-200 text-green-700',
    error: 'bg-red-100 border-red-200 text-red-700',
    info: 'bg-blue-100 border-blue-200 text-blue-700',
  }[messageType];

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
      <div className='bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full'>
        <h1 className='text-4xl font-bold text-gray-800 mb-6'>
          Upload New Leads
        </h1>
        <p className='text-gray-600 mb-6'>
          Upload a CSV file containing homeowner leads.
          <br />
          Expected columns:{' '}
          <span className='font-semibold'>
            First Name, Last Name, Street Address, City, State, Postal Code
          </span>
          .
        </p>{' '}
        {/* <-- UPDATED INSTRUCTIONAL TEXT */}
        {message && (
          <p className={`p-3 rounded-md border text-sm mb-6 ${messageClasses}`}>
            {message}
          </p>
        )}
        <form onSubmit={handleUpload} className='space-y-4'>
          <div>
            <label htmlFor='csv-file-input' className='sr-only'>
              Upload CSV File
            </label>
            <input
              type='file'
              id='csv-file-input'
              accept='.csv'
              onChange={handleFileChange}
              className='block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
            />
          </div>
          <button
            type='submit'
            disabled={uploading || !selectedFile}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </form>
        <p className='mt-6 text-sm text-gray-600'>
          <Link
            href='/dashboard'
            className='text-gray-500 hover:text-gray-700 font-medium'
          >
            &larr; Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
