import { upload } from '@/app/config/multer';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  upload.single('csvfile');
  console.log(request.formData());

  return NextResponse.name;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/',
};
