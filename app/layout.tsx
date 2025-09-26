import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PasswordProtect from './components/PasswordProtect';
import './globals.css';

export const metadata: Metadata = {
  title: 'BUYSELL Dashboard',
  description: 'Brand-level sales visibility dashboard for BUYSELL Technologies.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <PasswordProtect>
          {children}
        </PasswordProtect>
      </body>
    </html>
  );
}
