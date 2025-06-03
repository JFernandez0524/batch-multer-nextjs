// app/layout.tsx
// This is a Server Component by default, but it can import Client Components.
// The AuthProvider itself should be a Client Component.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../components/AuthContext'; // <-- NEW: Import AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lead Skiptrace App', // Updated title for clarity
  description:
    'Membership website for lead skip-tracing with Firebase and Next.js', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        {/*
          IMPORTANT: Wrap your 'children' with AuthProvider.
          The AuthProvider itself should be marked with 'use client';
          as it uses React hooks and Firebase client-side SDK.
          This ensures all components within your app can use `useAuth()`.
        */}
        <AuthProvider>
          {' '}
          {/* <-- NEW: AuthProvider wraps the content */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
