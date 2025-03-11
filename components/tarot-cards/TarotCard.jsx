import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function TarotCard({ card, position, isRevealed, onSelect, isSelectable }) {
  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cardError, setCardError] = useState(false);
  
  // Log card properties when the component mounts or when card/position changes
  useEffect(() => {
    if (card && position) {
      console.log(`TarotCard mounted: position ${position}, card ${card.name}, id ${card.id}`);
    }
  }, [card, position]);
  
  // Log when the card is revealed
  useEffect(() => {
    if (isRevealed && card) {
      console.log(`Card ${position} revealed: ${card.name}, Image: ${card.image}`);
    }
  }, [isRevealed, card, position]);
  
  const handleClick = () => {
    if (isSelectable && !isRevealed && card) {
      console.log(`Card ${position} being selected:`, card.name, card.nameTh);
      setIsSelected(true);
      
      // Make sure we pass a clean copy of the card object
      const cardCopy = { ...card };
      onSelect(cardCopy, position);
    }
  };
  
  const handleImageError = (e) => {
    console.error(`Failed to load image for card: ${card?.name || 'unknown'}`);
    setCardError(true);
    e.target.src = '/images/cards/back.png';
  };
  
  // If no card is provided, render a placeholder
  if (!card) {
    return (
      <div className="relative w-48 h-80">
        <div className="w-full h-full bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
          <p className="text-gray-500">ไม่มีไพ่</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`relative w-48 h-80 transition-all duration-300 ${
        isSelectable ? 'cursor-pointer' : ''
      } ${
        isHovered && isSelectable ? 'transform -translate-y-2' : ''
      } ${
        isSelected ? 'ring-4 ring-indigo-400 scale-105' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRevealed ? (
        // Front of the card (revealed)
        <div className="relative w-full h-full">
          {cardError ? (
            <div className="w-full h-full bg-gray-100 rounded-lg shadow-lg flex flex-col items-center justify-center p-4">
              <p className="text-lg font-bold text-center">{card.nameTh}</p>
              <p className="text-sm text-gray-600 text-center mt-2">{card.name}</p>
            </div>
          ) : (
            <Image 
              src={`/images/cards/${card.image}`}
              alt={card.name}
              width={192}
              height={320}
              className="w-full h-full rounded-lg shadow-lg"
              onError={handleImageError}
            />
          )}
          <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {position}
          </div>
        </div>
      ) : (
        // Back of the card (not revealed)
        <div className="relative w-full h-full">
          <img 
            src="/images/cards/back.png"
            alt="ด้านหลังไพ่"
            className="w-full h-full rounded-lg shadow-lg object-cover"
            onError={(e) => {
              console.error("Failed to load back image");
              e.target.style.backgroundColor = "blue"; // Show blue if image fails to load
            }}
          />
          {isSelectable && isHovered && (
            <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg"></div>
          )}
        </div>
      )}
    </div>
  );
}