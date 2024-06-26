'use server';
import { upload } from '@/middleware/multer';

export async function test(formData: FormData) {
  const formObject = Object.fromEntries(formData);

  console.log(formObject.csvfile);
}
