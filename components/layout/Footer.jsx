import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">ไพ่ยิปซี AI</h3>
            <p className="text-gray-600">
              บริการดูไพ่ยิปซีออนไลน์ด้วย AI ที่วิเคราะห์แม่นยำ
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">เมนู</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link href="/reading" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  ดูไพ่
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  เกี่ยวกับ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">ติดต่อ</h3>
            <p className="text-gray-600 mb-2">
              อีเมล: contact@tarot-ai.example.com
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Facebook
              </a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Instagram
              </a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Line
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} ไพ่ยิปซี AI. สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </footer>
  );
}