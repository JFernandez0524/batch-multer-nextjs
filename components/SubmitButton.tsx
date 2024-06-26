'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className='px-4 py-1 bg-blue-500 rounded-md text-sm ml-1'
      type='submit'
      disabled={pending}
    >
      Submit
    </button>
  );
}
