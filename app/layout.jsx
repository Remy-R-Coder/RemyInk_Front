import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import '@/styles/globals.css';
import '@/app.scss';
import { AppProviders } from '@/contexts/AppContexts';
import QueryProvider from '@/components/QueryProvider';

const geist = Geist({
  subsets: ["latin"],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

export const metadata = {
  title: {
    default: 'RemyInk! - Academic Support Marketplace',
    template: '%s | RemyInk!'
  },
  description: 'Connect with experts for tutoring, proofreading, editing and academic guidance. RemyInk! helps you learn, improve, and succeed.',
  keywords: ['academic support', 'tutoring', 'proofreading', 'editing', 'study help', 'exam preparation', 'marketplace'],
  authors: [{ name: 'RemyInk!' }],
  creator: 'RemyInk!',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://remyink.com',
    title: 'RemyInk! - Academic Support Marketplace',
    description: 'Connect with experts for tutoring, editing, and academic guidance',
    siteName: 'RemyInk!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RemyInk! - Academic Support Marketplace',
    description: 'Connect with experts for tutoring, editing, and academic guidance',
  },
};

export default function RootLayout({
  children,
}) {
  return ( 
    <html lang="en">
      <body className={`${geist.className} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <AppProviders>
            {children}
          </AppProviders>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
