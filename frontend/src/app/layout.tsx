import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CloudService Team 3',
  description: 'Project management and deployment starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
