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
    default: 'RemyInk! - Academic Services Marketplace',
    template: '%s | RemyInk!'
  },
  description: 'Connect with expert freelancers for academic services, writing, research, and more. RemyInk! is your trusted platform for quality academic assistance.',
  keywords: ['academic services', 'freelancers', 'writing', 'research', 'tutoring', 'marketplace'],
  authors: [{ name: 'RemyInk!' }],
  creator: 'RemyInk!',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://remyink.com',
    title: 'RemyInk! - Academic Services Marketplace',
    description: 'Connect with expert freelancers for academic services',
    siteName: 'RemyInk!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RemyInk! - Academic Services Marketplace',
    description: 'Connect with expert freelancers for academic services',
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
