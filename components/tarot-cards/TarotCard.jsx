// components/tarot-cards/TarotCard.jsx
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function TarotCard({ card, position, isRevealed, onSelect, isSelectable }) {
  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    if (isSelectable && !isRevealed) {
      setIsSelected(true);
      onSelect(card, position);
    }
  };
  
  useEffect(() => {
    if (isRevealed && card) {
      console.log(`Card ${position} revealed: ${card.name}, Image: ${card.image}`);
    }
  }, [isRevealed, card, position]);
  
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
        // ด้านหน้าไพ่ (เมื่อถูกเปิด)
        <div className="relative w-full h-full">
          <Image 
            src={`/images/cards/${card.image}`}
            alt={card.name}
            width={192}
            height={320}
            className="w-full h-full rounded-lg shadow-lg"
            onError={(e) => {
              console.error(`Failed to load image: ${card.image}`);
              e.target.src = '/images/cards/back.png';
            }}
          />
          <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {position}
          </div>
        </div>
      ) : (
        // ด้านหลังไพ่ (เมื่อยังไม่เปิด)
         // ด้านหลังไพ่
         <div className="relative w-full h-full">
         <img 
           src="/images/cards/back.png"
           alt="ด้านหลังไพ่"
           className="w-full h-full rounded-lg shadow-lg object-cover"
           onError={(e) => {
             console.error("Failed to load back image");
             e.target.style.backgroundColor = "blue"; // แสดงสีน้ำเงินถ้าโหลดรูปไม่สำเร็จ
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