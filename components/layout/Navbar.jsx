import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-indigo-600 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">ไพ่ยิปซี AI</Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="hover:text-indigo-200 transition-colors">หน้าแรก</Link>
              </li>
              <li>
                <Link href="/reading" className="hover:text-indigo-200 transition-colors">ดูไพ่</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-indigo-200 transition-colors">เกี่ยวกับ</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}