import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AssessmentProvider } from '@/context/AssessmentContext';
import { AppShell } from '@/components/AppShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CognitiveAssessment | Multi-Agent Evaluation System',
  description:
    'A simple, professional Multi-Agent Student Cognitive Assessment portal powered by Groq and specialized reasoning agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative">
        <AssessmentProvider>
          <AppShell>{children}</AppShell>
        </AssessmentProvider>
      </body>
    </html>
  );
}
