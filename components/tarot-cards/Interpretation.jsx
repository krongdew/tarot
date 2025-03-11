// components/tarot-cards/Interpretation.jsx
export default function Interpretation({ interpretation, cards, onReset }) {
  // ตรวจสอบความพร้อมของข้อมูลการตีความ
  if (!interpretation || !interpretation.positionInterpretations) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">การแสดงผลมีปัญหา</h2>
        <p className="text-gray-700 mb-4">ข้อมูลการทำนายไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง</p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={onReset}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            ดูไพ่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }
  
  console.log("Rendering interpretation data:", interpretation);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">คำทำนายของคุณ</h2>
      
      {/* แสดงข้อมูลของแต่ละไพ่ */}
      {cards.map((cardItem, index) => {
        // หาข้อมูลการตีความที่ตรงกับตำแหน่งปัจจุบัน
        const position = interpretation.positionInterpretations.find(p => 
          Number(p.position) === index + 1 || p.position === index + 1
        ) || interpretation.positionInterpretations[index];
        
        // ตรวจสอบว่ามีข้อมูลการตีความหรือไม่
        if (!position) {
          return (
            <div key={index} className="mb-6 border-b pb-4">
              <h3 className="text-xl font-semibold mb-2">
                {index + 1}. {cardItem?.nameTh || `ไพ่ใบที่ ${index + 1}`}
              </h3>
              <p className="text-gray-700 mb-2">ไม่พบข้อมูลการตีความสำหรับไพ่ใบนี้</p>
            </div>
          );
        }
        
        return (
          <div key={index} className="mb-6 border-b pb-4">
            <h3 className="text-xl font-semibold mb-2">
              {index + 1}. {cardItem?.nameTh || position.card} - {position.title}
            </h3>
            {/* ใช้ CSS กำหนดให้แสดงข้อความเต็ม ไม่มีการตัด */}
            <p className="text-gray-700 mb-2 whitespace-normal break-words">
              {position.meaning}
            </p>
          </div>
        );
      })}
      
      {/* แสดงส่วนสรุปและคำแนะนำ */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-3">สรุปการทำนาย</h3>
        {/* ใช้ CSS กำหนดให้แสดงข้อความเต็ม ไม่มีการตัด */}
        <p className="text-gray-700 mb-4 whitespace-normal break-words">
          {interpretation.summary || "ไม่มีข้อมูลสรุป"}
        </p>
        
        <h3 className="text-xl font-semibold mb-3">คำแนะนำ</h3>
        {/* ใช้ CSS กำหนดให้แสดงข้อความเต็ม ไม่มีการตัด */}
        <p className="text-gray-700 mb-4 whitespace-normal break-words">
          {interpretation.advice || "ไม่มีคำแนะนำ"}
        </p>
      </div>
      
      <div className="mt-8 flex justify-center">
        <button
          onClick={onReset}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          ดูไพ่อีกครั้ง
        </button>
      </div>
    </div>
  );
}