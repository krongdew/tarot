'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { tarotDeck, positionMeanings, readingCategories } from '@/lib/tarot-data';
import TarotCard from '@/components/tarot-cards/TarotCard';
import Interpretation from '@/components/tarot-cards/Interpretation';
import { shuffleArray } from '@/lib/utils';

// สร้าง Client Component แยกต่างหาก
function ReadingContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category') || 'general';
  const category = readingCategories.find(cat => cat.id === categoryId) || readingCategories[0];
  
  const [question, setQuestion] = useState('');
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [selectedCards, setSelectedCards] = useState([null, null, null, null]);
  const [isReading, setIsReading] = useState(false);
  const [readingState, setReadingState] = useState('input'); // input, selecting, reveal, interpretation
  const [interpretation, setInterpretation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // ตอนโหลดหน้า สับไพ่เตรียมไว้
    setShuffledDeck(shuffleArray([...tarotDeck]));
  }, []);
  
  const startReading = () => {
    if (!question.trim()) {
      alert('กรุณาใส่คำถามก่อนเริ่มดูไพ่');
      return;
    }
    
    setReadingState('selecting');
    setShuffledDeck(shuffleArray([...tarotDeck]));
  };
  
  const handleCardSelect = (card, position) => {
    const newSelectedCards = [...selectedCards];
    newSelectedCards[position - 1] = card;
    setSelectedCards(newSelectedCards);
    
    // ตรวจสอบว่าเลือกไพ่ครบ 4 ใบหรือยัง
    if (newSelectedCards.filter(c => c !== null).length === 4) {
      setReadingState('reveal');
      setTimeout(() => {
        getInterpretation();
      }, 1500);
    }
  };
  
  const getInterpretation = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          category: categoryId,
          cards: selectedCards.map((card, index) => ({
            ...card,
            position: index + 1,
            positionMeaning: positionMeanings[index + 1].name
          }))
        }),
      });
      
      const data = await response.json();
      
      if (data.interpretation) {
        setInterpretation(data.interpretation);
        setReadingState('interpretation');
      } else {
        throw new Error('Failed to get interpretation');
      }
    } catch (error) {
      console.error('Error getting interpretation:', error);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์ไพ่ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetReading = () => {
    setQuestion('');
    setSelectedCards([null, null, null, null]);
    setReadingState('input');
    setInterpretation(null);
    setShuffledDeck(shuffleArray([...tarotDeck]));
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">ดูไพ่ยิปซี - {category.name}</h1>
      
      {readingState === 'input' && (
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">ใส่คำถามของคุณ</h2>
          <p className="text-gray-600 mb-4">{category.description}</p>
          
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="พิมพ์คำถามของคุณที่นี่..."
            className="w-full p-3 border rounded-md mb-4"
            rows={4}
          />
          
          <button
            onClick={startReading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            เริ่มดูไพ่
          </button>
        </div>
      )}
      
      {readingState === 'selecting' && (
        <div>
          <h2 className="text-xl font-semibold text-center mb-6">เลือกไพ่ 4 ใบโดยใช้สัญชาตญาณของคุณ</h2>
          <p className="text-center mb-8">เลือกไพ่ {selectedCards.filter(c => c !== null).length}/4</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {shuffledDeck.slice(0, 24).map((card, index) => (
              <TarotCard
                key={index}
                card={card}
                position={selectedCards.filter(c => c !== null).length + 1}
                isRevealed={false}
                onSelect={handleCardSelect}
                isSelectable={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {(readingState === 'reveal' || readingState === 'interpretation') && (
        <div>
          <h2 className="text-xl font-semibold text-center mb-6">
            ไพ่ของคุณ: {question}
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {selectedCards.map((card, index) => (
              <div key={index} className="text-center">
                <TarotCard
                  card={card}
                  position={index + 1}
                  isRevealed={true}
                  isSelectable={false}
                />
                <p className="mt-2 font-medium">{card.nameTh}</p>
                <p className="text-sm text-gray-600">{positionMeanings[index + 1].name}</p>
              </div>
            ))}
          </div>
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="spinner"></div>
              <p className="mt-4">AI กำลังวิเคราะห์ไพ่ของคุณ...</p>
            </div>
          )}
          
          {readingState === 'interpretation' && interpretation && (
            <Interpretation 
              interpretation={interpretation} 
              cards={selectedCards}
              onReset={resetReading}
            />
          )}
        </div>
      )}
    </div>
  );
}

// หน้าหลักที่ใช้ Suspense
export default function ReadingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <ReadingContent />
    </Suspense>
  );
}