//components\tarot-cards\Interpretation.jsx
export default function Interpretation({ interpretation, cards, onReset }) {
    // Check if we have complete data
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
    
    // Debug: log interpretation data
    console.log("Rendering interpretation with data:", interpretation);
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">คำทำนายของคุณ</h2>
        
        {/* Handle each position/card */}
        {cards.map((cardItem, index) => {
          // Find the corresponding interpretation
          // This works even if the data structure is inconsistent
          const position = interpretation.positionInterpretations.find(p => 
            p.position === index + 1 || 
            // Support different formats of position
            (typeof p.position === 'string' && parseInt(p.position) === index + 1)
          );
          
          // If position is not found in the normal array locations, check if it might be a nested object
          let positionData = position;
          
          if (!positionData && index < interpretation.positionInterpretations.length) {
            // Try to get from array index directly if position matching failed
            positionData = interpretation.positionInterpretations[index];
          }
          
          // If we have no position data at all, create a minimal object to avoid errors
          if (!positionData) {
            console.warn(`No interpretation data found for card at position ${index + 1}`);
            positionData = {
              card: cardItem?.name || `Card ${index + 1}`,
              title: "ข้อมูลไม่พร้อม",
              meaning: "ไม่สามารถแสดงความหมายได้ในขณะนี้"
            };
          }
          
          // Ensure position has meaning and title
          const title = positionData.title || "";
          const meaning = positionData.meaning || "";
          
          return (
            <div key={index} className="mb-6 border-b pb-4">
              <h3 className="text-xl font-semibold mb-2">
                {index + 1}. {cardItem?.nameTh || positionData.card} - {title}
              </h3>
              <p className="text-gray-700 mb-2">
                {meaning}
              </p>
            </div>
          );
        })}
        
        {/* Summary and advice section */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3">สรุปการทำนาย</h3>
          <p className="text-gray-700 mb-4">{interpretation.summary || "ไม่มีข้อมูลสรุป"}</p>
          
          <h3 className="text-xl font-semibold mb-3">คำแนะนำ</h3>
          <p className="text-gray-700 mb-4">{interpretation.advice || "ไม่มีคำแนะนำ"}</p>
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