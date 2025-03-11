'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { tarotDeck, positionMeanings, readingCategories } from '@/lib/tarot-data';
import TarotCard from '@/components/tarot-cards/TarotCard';
import Interpretation from '@/components/tarot-cards/Interpretation';
import { shuffleArray } from '@/lib/utils';

// Client Component
function ReadingContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category') || 'general';
  const category = readingCategories.find(cat => cat.id === categoryId) || readingCategories[0];
  
  const [question, setQuestion] = useState('');
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [selectedCards, setSelectedCards] = useState([null, null, null, null]);
  const [readingState, setReadingState] = useState('input'); // input, selecting, reveal, interpretation
  const [interpretation, setInterpretation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Shuffle deck on page load
    setShuffledDeck(shuffleArray([...tarotDeck]));
  }, []);
  
  const startReading = () => {
    if (!question.trim()) {
      alert('กรุณาใส่คำถามก่อนเริ่มดูไพ่');
      return;
    }
    
    setReadingState('selecting');
    setShuffledDeck(shuffleArray([...tarotDeck]));
    // Reset selected cards when starting a new reading
    setSelectedCards([null, null, null, null]);
  };
  
  const handleCardSelect = (card, position) => {
    // Validate position
    if (position < 1 || position > 4) {
      console.error(`Invalid position: ${position}`);
      return;
    }
    
    // Calculate current position that should be selected
    const currentPosition = selectedCards.filter(c => c !== null).length + 1;
    if (position !== currentPosition) {
      console.warn(`User tried to select card for position ${position} but current position should be ${currentPosition}`);
      position = currentPosition;
    }
    
    // Create a deep copy of the card to prevent reference issues
    const cardCopy = JSON.parse(JSON.stringify(card));
    
    // Create a new array to ensure state update
    const newSelectedCards = [...selectedCards];
    newSelectedCards[position - 1] = cardCopy;
    
    // Debug log to verify card data
    console.log(`Card ${position} selected:`, cardCopy.name, cardCopy.nameTh);
    
    // Perform state update with the new array
    setSelectedCards(newSelectedCards);
    
    // Check if all 4 cards have been selected
    if (newSelectedCards.filter(c => c !== null).length === 4) {
      // Store selected cards in session storage as a backup
      try {
        sessionStorage.setItem('selectedTarotCards', JSON.stringify(newSelectedCards));
      } catch (err) {
        console.warn('Failed to store cards in session storage:', err);
      }
      
      // Debug log to verify all cards before moving to reveal state
      console.log("All 4 cards selected:", newSelectedCards.map(c => c?.name || 'null'));
      
      setReadingState('reveal');
      setTimeout(() => {
        getInterpretation();
      }, 1500);
    }
  };
  
  const getInterpretation = async () => {
    setIsLoading(true);
    
    try {
      // Try to recover cards from session storage if needed
      let cardsForReading = [...selectedCards];
      
      // Check if we have any nulls in the selected cards
      const hasNulls = cardsForReading.some(card => !card);
      
      if (hasNulls) {
        // Try to recover from session storage
        try {
          const storedCards = sessionStorage.getItem('selectedTarotCards');
          if (storedCards) {
            cardsForReading = JSON.parse(storedCards);
            console.log("Recovered cards from session storage:", cardsForReading);
          }
        } catch (err) {
          console.warn("Failed to recover cards from session storage:", err);
        }
      }
      
      // Log current state for debugging
      console.log("Checking selected cards before API call:", cardsForReading);
      
      // Create a stable copy for API request to prevent mutations
      const cardsToSend = cardsForReading.map((card, index) => {
        if (!card) {
          console.error(`Card at position ${index + 1} is still null or undefined after recovery attempts`);
          
          // Use fallback card based on position
          const fallbackCard = tarotDeck.find(c => 
            index === 0 ? c.name === "The Fool" :
            index === 1 ? c.name === "The Wheel of Fortune" :
            index === 2 ? c.name === "The Star" :
            c.name === "The World"
          ) || tarotDeck[index];
          
          console.log(`Using fallback card for position ${index + 1}:`, fallbackCard.name);
          return {
            ...fallbackCard,
            position: index + 1,
            positionMeaning: positionMeanings[index + 1].name
          };
        }
        
        // Return a clean copy of the card with position information
        return {
          ...card,
          position: index + 1,
          positionMeaning: positionMeanings[index + 1].name
        };
      });
      
      // Log the final data being sent to API
      console.log("Cards data being sent to API:", JSON.stringify(cardsToSend.map(card => ({
        name: card.name,
        nameTh: card.nameTh,
        position: card.position
      })), null, 2));
      
      // Send API request
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          category: categoryId,
          cards: cardsToSend
        }),
      });
      
      const data = await response.json();
      
      // Process the API response
      processApiResponse(data, cardsToSend);
    } catch (error) {
      console.error('Error getting interpretation:', error);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์ไพ่ กรุณาลองใหม่อีกครั้ง');
      setIsLoading(false);
    }
  };
  
  const processApiResponse = (data, sentCards) => {
    if (data.error) {
      console.error('API returned an error:', data.error);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์ไพ่ กรุณาลองใหม่อีกครั้ง');
      setIsLoading(false);
      return;
    }
    
    // Check data
    console.log("Data received from API:", data);
    
    if (data.interpretation) {
      // Fix any inconsistencies in the API response
      if (data.interpretation.positionInterpretations) {
        data.interpretation.positionInterpretations.forEach((interp, index) => {
          // Fix cases where the card name is undefined or doesn't match what we sent
          if (interp.card === "undefined" || !interp.card) {
            if (sentCards && sentCards[index]) {
              interp.card = sentCards[index].name;
              console.log(`Fixed undefined card at position ${index + 1} with ${sentCards[index].name}`);
            } else if (selectedCards[index]) {
              interp.card = selectedCards[index].name;
              console.log(`Fixed undefined card at position ${index + 1} with ${selectedCards[index].name}`);
            }
          }
          
          // Check if API returned a different card than what we sent
          if (sentCards && sentCards[index] && interp.card !== sentCards[index].name) {
            console.warn(`API returned different card at position ${index + 1}: sent ${sentCards[index].name} but got ${interp.card}`);
            
            // Fix the mismatch by using what we sent
            interp.card = sentCards[index].name;
          }
        });
      }
      
      setInterpretation(data.interpretation);
      setReadingState('interpretation');
    } else {
      console.error('Invalid interpretation data:', data);
      alert('ข้อมูลการตีความไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
    
    setIsLoading(false);
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
                isSelectable={selectedCards.filter(c => c !== null).length < 4}
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
            {selectedCards.map((card, index) => {
              // Check if card exists at this position
              if (!card) {
                return (
                  <div key={index} className="text-center">
                    <div className="w-48 h-80 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                      <p className="text-gray-500">ไพ่หายไป</p>
                    </div>
                    <p className="mt-2 font-medium">ไม่พบไพ่</p>
                    <p className="text-sm text-gray-600">{positionMeanings[index + 1].name}</p>
                  </div>
                );
              }
              
              return (
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
              );
            })}
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

// Main page with Suspense
export default function ReadingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <ReadingContent />
    </Suspense>
  );
}