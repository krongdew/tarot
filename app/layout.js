// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ไพ่ยิปซี AI - ทำนายด้วย AI ที่แม่นยำ',
  description: 'บริการดูไพ่ยิปซีออนไลน์ด้วย AI ที่วิเคราะห์แม่นยำ ดูไพ่ 4 ใบแบบเจาะลึก',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
