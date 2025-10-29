// app/layout.tsx
import type { Metadata } from 'next';
import { ToastProvider } from './components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quản lý Văn bản',
  description: 'Hệ thống quản lý văn bản thông minh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}