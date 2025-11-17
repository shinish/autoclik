import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import LayoutWrapper from '@/components/LayoutWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Autoclik - Automation Platform with Ansible AWX Integration',
    template: '%s | Autoclik',
  },
  description: 'Modern automation platform built with Next.js that integrates with Ansible AWX for executing runbooks and managing IT automation workflows. Features include automation builder, run management, scheduling, and RBAC.',
  keywords: ['automation', 'ansible', 'awx', 'devops', 'it automation', 'runbooks', 'workflow automation', 'next.js', 'infrastructure automation', 'job templates', 'rbac', 'automation platform'],
  authors: [{ name: 'Shinish Sasidharan' }],
  creator: 'Shinish Sasidharan',
  publisher: 'Autoclik',
  applicationName: 'Autoclik',
  generator: 'Next.js',
  category: 'Technology',
  classification: 'Automation Software',

  // Open Graph / Facebook
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3000',
    siteName: 'Autoclik',
    title: 'Autoclik - Automation Platform with Ansible AWX Integration',
    description: 'Modern automation platform for executing Ansible AWX runbooks and managing IT automation workflows',
    images: [
      {
        url: '/dark.png',
        width: 1200,
        height: 630,
        alt: 'Autoclik Logo',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Autoclik - Automation Platform',
    description: 'Modern automation platform with Ansible AWX integration',
    creator: '@autoclik',
    images: ['/dark.png'],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification
  verification: {
    google: 'verification_token', // Replace with actual Google verification token
    // yandex: 'yandex_verification_token',
    // bing: 'msvalidate.01=...',
  },

  // Additional metadata
  alternates: {
    canonical: 'http://localhost:3000',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <ThemeProvider>
          <AuthProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
