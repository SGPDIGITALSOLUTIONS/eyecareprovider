import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Frame Store - I Care Services Providers Ltd',
  description: 'Premium eyewear frames and lens options',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
