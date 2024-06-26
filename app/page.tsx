import { test } from '@/app/utils/actions';
import Form from '@/components/Form';
import { SubmitButton } from '@/components/SubmitButton';

export default function Home() {
  return (
    <main className='w-full'>
      <h2>Home</h2>
      <section className='flex justify-center'>
        {/* <div className='form-container bg-slate-200 w-4/5 text-center py-3'>
          <form action={test}>
            <input
              className='border'
              formEncType='multipart/form-data'
              type='file'
              name='csvfile'
            />
            <SubmitButton />
          </form>
        </div> */}
        <Form />
      </section>
    </main>
  );
}
