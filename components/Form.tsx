'use client';

import React from 'react';
import { useState } from 'react';

const Form = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const formStyle = 'max-w-lg flex flex-col gap-y-4 shadow rounded p-8';
  const inputStyle = 'border shadow rounded py-2 px-3 text-gray-700';
  const btnStyle =
    'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded capitalize';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a CSV file.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setMessage(data.message);
    } catch (error: any) {
      setMessage('Error uploading data: ' + error.message);
    }
  };

  return (
    <section>
      <h2 className='text-2xl capitalize mb-4'>Upload CSV File</h2>
      <form onSubmit={handleSubmit} className={formStyle}>
        <input type='file' accept='.csv' onChange={handleFileChange} />
        <button className={btnStyle} type='submit'>
          Upload
        </button>
      </form>
    </section>
  );
};

export default Form;
