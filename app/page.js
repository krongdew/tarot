import Link from 'next/link';
import { readingCategories } from '@/lib/tarot-data';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">ไพ่ยิปซี AI</h1>
        <p className="text-xl text-gray-600 mb-8">ค้นหาคำตอบจากไพ่ยิปซี 4 ใบด้วย AI ที่วิเคราะห์แม่นยำ</p>
        <Link 
          href="/reading" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          เริ่มดูไพ่เลย
        </Link>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-center mb-8">ดูไพ่ตามหมวดหมู่</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readingCategories.map(category => (
            <Link 
              key={category.id}
              href={`/reading?category=${category.id}`}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
              <p className="text-gray-600">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 p-8 rounded-xl">
        <h2 className="text-2xl font-semibold text-center mb-6">วิธีการดูไพ่</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">1</div>
            <p>เลือกหมวดหมู่และตั้งคำถาม</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">2</div>
            <p>สับไพ่และเลือกไพ่ 4 ใบ</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">3</div>
            <p>AI วิเคราะห์ความหมายของไพ่</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-indigo-600 mb-2">4</div>
            <p>รับคำทำนายที่แม่นยำ</p>
          </div>
        </div>
      </section>
    </div>
  );
}
