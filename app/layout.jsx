import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import LayoutWrapper from '@/components/LayoutWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata = {
  title: 'Autoclik v1.0',
  description: 'Automation platform with Ansible AWX integration',
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
