export default function Interpretation({ interpretation, cards, onReset }) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">คำทำนายของคุณ</h2>
        
        {cards.map((card, index) => (
          <div key={index} className="mb-6 border-b pb-4">
            <h3 className="text-xl font-semibold mb-2">
              {index + 1}. {card.nameTh} - {interpretation.positionInterpretations[index].title}
            </h3>
            <p className="text-gray-700 mb-2">
              {interpretation.positionInterpretations[index].meaning}
            </p>
          </div>
        ))}
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3">สรุปการทำนาย</h3>
          <p className="text-gray-700 mb-4">{interpretation.summary}</p>
          
          <h3 className="text-xl font-semibold mb-3">คำแนะนำ</h3>
          <p className="text-gray-700 mb-4">{interpretation.advice}</p>
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
  