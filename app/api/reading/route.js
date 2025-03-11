// app/api/reading/route.js
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { tarotDeck } from '@/lib/tarot-data';

// สร้าง OpenAI client ที่ชี้ไปที่ OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// ฟังก์ชันสำหรับปรับโครงสร้างข้อมูลการตีความให้เป็นรูปแบบเดียวกัน
function normalizeInterpretation(interpretation) {
  if (!interpretation || typeof interpretation !== 'object') {
    console.error('Invalid interpretation to normalize');
    return null;
  }
  
  // ตรวจสอบโครงสร้างข้อมูล positionInterpretations
  if (!interpretation.positionInterpretations || !Array.isArray(interpretation.positionInterpretations)) {
    console.error('Missing or invalid positionInterpretations array');
    return interpretation;
  }
  
  // ปรับโครงสร้างข้อมูลไพ่แต่ละตำแหน่ง
  const normalizedPositions = interpretation.positionInterpretations.map((pos, index) => {
    // ทำให้แน่ใจว่ามีโครงสร้างครบถ้วน
    return {
      position: pos.position || (index + 1),
      card: pos.card || "Unknown Card",
      title: pos.title || "",
      meaning: pos.meaning ? pos.meaning.replace(/\s{20,}/g, " ") : "" // แก้ไขช่องว่างที่มากเกินไป
    };
  });
  
  // ตรวจสอบว่ามีฟิลด์ที่จำเป็นครบถ้วน
  return {
    positionInterpretations: normalizedPositions,
    summary: interpretation.summary || "",
    advice: interpretation.advice || ""
  };
}

// ฟังก์ชันสำหรับแก้ไข JSON ที่อาจมีปัญหา
function fixBrokenJSON(jsonStr) {
  // ทำความสะอาดพื้นฐาน
  let cleaned = jsonStr.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[^\x20-\x7E]/g, '');
  
  // ตรวจสอบและแก้ไขสตริงที่ไม่สมบูรณ์
  try {
    // ลองแยกวิเคราะห์ JSON ที่ทำความสะอาดแล้ว
    JSON.parse(cleaned);
    return cleaned; // ถ้าสามารถแยกวิเคราะห์ได้ ให้ใช้เวอร์ชันนี้
  } catch (error) {
    console.log("พบข้อผิดพลาดในการวิเคราะห์ JSON:", error.message);
    
    // ถ้ามีปัญหา "Unterminated string"
    if (error.message.includes("Unterminated string")) {
      // หาตำแหน่งประมาณที่มีปัญหา
      const errorPos = parseInt(error.message.match(/position (\d+)/)?.[1] || "0");
      
      // ตัดส่วนก่อนจุดที่มีปัญหา
      let fixedJSON = cleaned.substring(0, errorPos);
      
      // หาเครื่องหมายคำพูดล่าสุดและปิดมัน
      const lastQuotePos = fixedJSON.lastIndexOf('"');
      if (lastQuotePos > 0 && fixedJSON.charAt(lastQuotePos - 1) !== '\\') {
        fixedJSON = fixedJSON.substring(0, lastQuotePos + 1);
        
        // หาตำแหน่งเริ่มต้นของสตริงนี้
        const strStart = fixedJSON.lastIndexOf(':"');
        if (strStart > 0) {
          // ตัดสตริงที่มีปัญหาออกและปิดโครงสร้างที่เหลือ
          const beforeStr = fixedJSON.substring(0, strStart + 2);
          
          // วิเคราะห์ตำแหน่งในโครงสร้าง JSON จากส่วนที่มาก่อน
          const openBraces = (beforeStr.match(/{/g) || []).length;
          const closeBraces = (beforeStr.match(/}/g) || []).length;
          const openBrackets = (beforeStr.match(/\[/g) || []).length;
          const closeBrackets = (beforeStr.match(/\]/g) || []).length;
          
          // สร้าง JSON ใหม่ที่มีโครงสร้างสมบูรณ์
          let result = beforeStr + '"';
          
          // ปิดวงเล็บตามจำนวนที่เปิดไว้
          if (openBrackets > closeBrackets) {
            result += "]".repeat(openBrackets - closeBrackets);
          }
          if (openBraces > closeBraces) {
            result += "}".repeat(openBraces - closeBraces);
          }
          
          return result;
        }
      }
    }
    
    // กรณีที่ไม่สามารถแก้ไขได้แบบเฉพาะเจาะจง ใช้การแก้ไขทั่วไป
    // ปิดสตริงที่ไม่สมบูรณ์โดยการเพิ่มเครื่องหมายคำพูด
    cleaned = cleaned.replace(/:\s*"([^"]*)(?=[,}])/g, ': "$1"');
    
    // ปิดวงเล็บปีกกาและวงเล็บเหลี่ยมที่ไม่สมบูรณ์
    const openBraces = (cleaned.match(/{/g) || []).length;
    const closeBraces = (cleaned.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      cleaned += "}".repeat(openBraces - closeBraces);
    }
    
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      cleaned += "]".repeat(openBrackets - closeBrackets);
    }
    
    return cleaned;
  }
}

// ฟังก์ชันสำหรับตรวจสอบว่าการ์ดมีข้อมูลครบหรือไม่
function validateCards(cards) {
  // ตรวจสอบว่ามีการ์ดครบ 4 ใบ
  if (!cards || cards.length !== 4) {
    return false;
  }
  
  // ตรวจสอบว่าการ์ดทุกใบมีข้อมูลพื้นฐานครบถ้วน
  return cards.every((card, index) => {
    if (!card) {
      console.error(`Card at position ${index + 1} is null or undefined`);
      return false;
    }
    
    if (!card.name || !card.nameTh) {
      console.error(`Card at position ${index + 1} has missing name or nameTh`);
      return false;
    }
    
    return true;
  });
}

// ฟังก์ชันสำหรับสร้างการตีความอัตโนมัติตามชื่อไพ่
function generateInterpretationFromTarotData(cards, question, category) {
  // ค้นหาข้อมูลไพ่จาก tarotDeck
  const cardData = cards.map(card => {
    const foundCard = tarotDeck.find(c => c.name === card.name);
    return foundCard || {
      name: card.name,
      nameTh: card.nameTh,
      meanings: { 
        upright: "ไม่พบความหมายของไพ่นี้ในฐานข้อมูล", 
        reversed: "ไม่พบความหมายของไพ่นี้ในฐานข้อมูล" 
      },
      keywords: ["ไม่พบคำสำคัญ"],
      element: ""
    };
  });

  // ข้อความที่เกี่ยวข้องกับหมวดหมู่
  const categoryContext = {
    general: "ชีวิตโดยรวม",
    love: "ความสัมพันธ์และความรัก",
    career: "การงานและอาชีพ",
    finance: "การเงินและทรัพย์สิน",
    spiritual: "จิตวิญญาณและการเติบโตภายใน",
    business: "ธุรกิจและการลงทุน"
  };

  const contextText = categoryContext[category] || "สถานการณ์ในชีวิต";

  // สร้างความหมายที่สอดคล้องกันมากขึ้นระหว่างไพ่ทั้ง 4 ใบ
  // สถานการณ์ปัจจุบัน
  const currentSituation = `ไพ่ ${cards[0].nameTh} ในตำแหน่งสถานการณ์ปัจจุบันแสดงว่า 
    คุณกำลังอยู่ในช่วงที่เกี่ยวข้องกับ${cardData[0].keywords ? cardData[0].keywords[0] : 'การเริ่มต้นใหม่'}
    ในด้าน${contextText} ${cardData[0].meanings.upright}`.replace(/\n\s+/g, ' ');

  // ความท้าทาย
  const challenge = `ไพ่ ${cards[1].nameTh} ในตำแหน่งความท้าทายแสดงให้เห็นว่า 
    สิ่งที่อาจเป็นอุปสรรคต่อคุณคือ${cardData[1].keywords ? cardData[1].keywords[0] : 'ความไม่แน่นอน'}
    คุณอาจต้องเผชิญกับ${cardData[1].meanings.upright.split('.')[0]}`.replace(/\n\s+/g, ' ');

  // คำแนะนำ
  const advice = `ไพ่ ${cards[2].nameTh} ในตำแหน่งคำแนะนำบอกว่า 
    คุณควรให้ความสำคัญกับ${cardData[2].keywords ? cardData[2].keywords.join(' และ ') : 'การปรับตัว'}
    ${cardData[2].meanings.upright}`.replace(/\n\s+/g, ' ');

  // ผลลัพธ์
  const outcome = `ไพ่ ${cards[3].nameTh} ในตำแหน่งผลลัพธ์ที่เป็นไปได้แสดงว่า 
    หากคุณทำตามคำแนะนำ คุณมีแนวโน้มที่จะได้พบกับ${cardData[3].keywords ? cardData[3].keywords[0] : 'การเปลี่ยนแปลงที่ดี'}
    ${cardData[3].meanings.upright}`.replace(/\n\s+/g, ' ');

  // สร้างการเชื่อมโยงระหว่างไพ่ทั้ง 4 ใบ
  const linkElements = [];
  
  // เชื่อมโยงระหว่างสถานการณ์และความท้าทาย
  if (cardData[0].element && cardData[1].element) {
    if (cardData[0].element === cardData[1].element) {
      linkElements.push(`ไพ่ในตำแหน่งที่ 1 และ 2 มีธาตุ ${cardData[0].element} เหมือนกัน แสดงถึงความสอดคล้องระหว่างสถานการณ์และความท้าทาย`);
    } else {
      linkElements.push(`ไพ่ในตำแหน่งที่ 1 (${cardData[0].element}) และ 2 (${cardData[1].element}) มีธาตุต่างกัน แสดงถึงความขัดแย้งระหว่างสถานการณ์และความท้าทาย`);
    }
  }

  // เชื่อมโยงระหว่างคำแนะนำและผลลัพธ์
  if (cardData[2].element && cardData[3].element) {
    if (cardData[2].element === cardData[3].element) {
      linkElements.push(`ไพ่ในตำแหน่งที่ 3 และ 4 มีธาตุ ${cardData[2].element} เหมือนกัน แสดงถึงความสอดคล้องระหว่างคำแนะนำและผลลัพธ์`);
    } else {
      linkElements.push(`คำแนะนำ (${cardData[2].element}) และผลลัพธ์ (${cardData[3].element}) มีธาตุต่างกัน ซึ่งอาจต้องใช้ความพยายามมากขึ้นในการบรรลุเป้าหมาย`);
    }
  }

  // สร้างบทสรุปที่เชื่อมโยงไพ่ทั้งหมด
  let summary = `สำหรับคำถามเกี่ยวกับ "${question}" ไพ่ทั้ง 4 ใบแสดงให้เห็นว่า คุณกำลังอยู่ในช่วงที่ต้องจัดการกับ${cardData[0].keywords ? cardData[0].keywords[0] : 'สถานการณ์ใหม่'} 
    ในขณะที่เผชิญกับความท้าทายด้าน${cardData[1].keywords ? cardData[1].keywords[0] : 'อุปสรรค'} 
    การใช้${cardData[2].keywords ? cardData[2].keywords[0] : 'วิธีการที่เหมาะสม'}จะนำไปสู่${cardData[3].keywords ? cardData[3].keywords[0] : 'ผลลัพธ์ที่ดี'}ในที่สุด`;

  summary = summary.replace(/\n\s+/g, ' ');

  // สร้างคำแนะนำที่เป็นรูปธรรมมากขึ้น
  const practicalAdvice = `เพื่อให้ได้ผลลัพธ์ที่ดีที่สุดในเรื่อง${contextText} คุณควรเน้นที่${cardData[2].keywords ? cardData[2].keywords.slice(0, 2).join(' และ ') : 'การแก้ไขปัญหาอย่างสร้างสรรค์'} 
    และหลีกเลี่ยง${cardData[1].keywords ? cardData[1].keywords[0] : 'อุปสรรคที่อาจเกิดขึ้น'} 
    การปรับเปลี่ยนมุมมองของคุณเกี่ยวกับ${cardData[0].keywords ? cardData[0].keywords[0] : 'สถานการณ์'}จะช่วยให้คุณบรรลุ${cardData[3].keywords ? cardData[3].keywords[0] : 'เป้าหมาย'}ได้ดียิ่งขึ้น`;

  // สร้างการตีความอัตโนมัติที่มีความเชื่อมโยงมากขึ้น
  return {
    positionInterpretations: [
      {
        position: 1,
        card: cards[0].name,
        title: "สถานการณ์ปัจจุบันของคุณ",
        meaning: currentSituation
      },
      {
        position: 2,
        card: cards[1].name,
        title: "สิ่งที่ท้าทายคุณ",
        meaning: challenge
      },
      {
        position: 3,
        card: cards[2].name,
        title: "คำแนะนำที่ควรทำตาม",
        meaning: advice
      },
      {
        position: 4,
        card: cards[3].name,
        title: "ผลลัพธ์ที่เป็นไปได้",
        meaning: outcome
      }
    ],
    summary: summary,
    advice: practicalAdvice.replace(/\n\s+/g, ' ')
  };
}

export async function POST(request) {
  let requestData;
  try {
    // เก็บข้อมูลคำขอไว้ใน scope ที่กว้างขึ้น
    requestData = await request.json();
    const { question, category, cards } = requestData;
    
    // ตรวจสอบข้อมูลพื้นฐาน
    if (!question || !category || !cards || cards.length !== 4) {
      console.error('Missing basic data', { question, category, cardsLength: cards?.length });
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // ตรวจสอบข้อมูลไพ่ทั้ง 4 ใบ
    if (!validateCards(cards)) {
      console.error('Invalid cards data');
      // กรณีข้อมูลไพ่ไม่ครบ ให้ใช้ฟังก์ชันสร้างคำตอบอัตโนมัติแทน
      const autoInterpretation = generateInterpretationFromTarotData(
        cards.map((card, index) => {
          if (!card || !card.name || !card.nameTh) {
            // หาไพ่ตัวอย่างสำหรับตำแหน่งที่มีปัญหา
            const fallbackCard = tarotDeck[index % tarotDeck.length];
            return {
              ...fallbackCard,
              position: index + 1
            };
          }
          return card;
        }), 
        question, 
        category
      );
      return NextResponse.json({ interpretation: normalizeInterpretation(autoInterpretation) });
    }

    // พิมพ์ข้อมูลการ์ดทั้งหมดเพื่อตรวจสอบ
    console.log("Cards data being processed:", JSON.stringify(cards.map(card => ({
      name: card.name,
      nameTh: card.nameTh,
      position: card.position
    })), null, 2));
    
    // สร้างพรอมต์ที่กระชับและมีรายละเอียดเพียงพอ
    const prompt = `
    คุณเป็นนักพยากรณ์ไพ่ทาโรต์มืออาชีพที่มีประสบการณ์กว่า 20 ปี กำลังตีความไพ่ทาโรต์เกี่ยวกับคำถาม: "${question}" (หมวดหมู่: ${category})
    
    ไพ่ที่เลือก:
    1. (สถานการณ์): ${cards[0].name} (${cards[0].nameTh})
    2. (อุปสรรค): ${cards[1].name} (${cards[1].nameTh})
    3. (คำแนะนำ): ${cards[2].name} (${cards[2].nameTh})
    4. (ผลลัพธ์): ${cards[3].name} (${cards[3].nameTh})
    
    ตอบเป็น JSON ดังนี้:
    {
      "positionInterpretations": [
        {"position": 1, "card": "${cards[0].name}", "title": "สถานการณ์ปัจจุบัน", "meaning": "อธิบายสั้นๆ 1-2 ประโยค"},
        {"position": 2, "card": "${cards[1].name}", "title": "ความท้าทาย", "meaning": "อธิบายสั้นๆ 1-2 ประโยค"},
        {"position": 3, "card": "${cards[2].name}", "title": "คำแนะนำ", "meaning": "อธิบายสั้นๆ 1-2 ประโยค"},
        {"position": 4, "card": "${cards[3].name}", "title": "ผลลัพธ์", "meaning": "อธิบายสั้นๆ 1-2 ประโยค"}
      ],
      "summary": "สรุปสั้นๆ เชื่อมโยงไพ่ทั้ง 4 ใบ",
      "advice": "คำแนะนำที่ชัดเจน นำไปปฏิบัติได้จริง"
    }
    
    สำคัญ: 
    1. ตอบเป็น JSON ที่ถูกต้อง ไม่ขึ้นบรรทัดใหม่ 
    2. ข้อความแต่ละส่วนต้องสั้น ไม่เกิน 80 ตัวอักษร
    3. คำอธิบายต้องเกี่ยวข้องกับคำถามและหมวดหมู่
    4. ใช้ภาษาที่เข้าใจง่าย เป็นรูปธรรม
    `;

    // เพิ่ม HTTP headers ที่จำเป็นสำหรับ OpenRouter
    const headers = {
      "HTTP-Referer": "https://tarot-8z5e.onrender.com/", 
      "X-Title": "Tarot AI App"
    };

    try {
      // เรียกใช้ OpenRouter API
      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 450, // ลดขนาดคำตอบให้เล็กลงเพื่อป้องกันการตัดกลางคัน
        headers: headers
      });

      // ตรวจสอบการตอบกลับจาก API
      if (!completion || !completion.choices || completion.choices.length === 0) {
        console.error('Invalid API response:', completion);
        throw new Error('ไม่ได้รับการตอบกลับที่ถูกต้องจาก API');
      }

      // ลอง debug ดูข้อมูลที่ได้รับก่อนแปลงเป็น JSON
      console.log("API Response:", completion.choices[0].message.content);

      // แก้ไข JSON ที่อาจมีปัญหา
      const fixedJSON = fixBrokenJSON(completion.choices[0].message.content);
      console.log("Fixed JSON:", fixedJSON);
      
      try {
        // ลองแยกวิเคราะห์ JSON ที่แก้ไขแล้ว
        const interpretation = JSON.parse(fixedJSON);
        
        // ตรวจสอบว่า JSON มีโครงสร้างที่ถูกต้อง
        if (!interpretation.positionInterpretations || 
            !Array.isArray(interpretation.positionInterpretations) || 
            interpretation.positionInterpretations.length !== 4) {
          console.warn('รูปแบบข้อมูลไม่สมบูรณ์, กำลังแก้ไข...');
          
          // แก้ไขข้อมูลที่ไม่สมบูรณ์
          if (!interpretation.positionInterpretations) {
            interpretation.positionInterpretations = [];
          }
          
          // ตรวจสอบข้อมูลไพ่แต่ละใบ
          for (let i = 0; i < 4; i++) {
            if (!interpretation.positionInterpretations[i]) {
              interpretation.positionInterpretations[i] = {
                position: i + 1,
                card: cards[i].name,
                title: i === 0 ? "สถานการณ์ปัจจุบัน" : 
                      i === 1 ? "ความท้าทาย" : 
                      i === 2 ? "คำแนะนำ" : "ผลลัพธ์",
                meaning: "ไม่มีข้อมูล"
              };
            }
          }
          
          // ตรวจสอบว่ามีสรุปและคำแนะนำหรือไม่
          if (!interpretation.summary) {
            interpretation.summary = "ไม่มีข้อมูลสรุป";
          }
          if (!interpretation.advice) {
            interpretation.advice = "ไม่มีข้อมูลคำแนะนำ";
          }
        }
        
        // ตรวจสอบและแก้ไขทุกตำแหน่งที่อาจมีปัญหา
        interpretation.positionInterpretations.forEach((pos, index) => {
          if (pos.card === "undefined" || !pos.card) {
            pos.card = cards[index].name;
          }
          
          // แก้ไขข้อความที่ถูกตัดตอน
          if (pos.meaning && pos.meaning.includes("                            ")) {
            pos.meaning = pos.meaning.replace(/\s{20,}/g, " ");
          }
          
          // ทำให้แน่ใจว่าความหมายไม่ยาวเกินไป
          if (pos.meaning && pos.meaning.length > 200) {
            pos.meaning = pos.meaning.substring(0, 197) + "...";
          }
        });
        
        return NextResponse.json({ interpretation: normalizeInterpretation(interpretation) });
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        // กรณีแปลง JSON ไม่ได้ ให้ใช้ฟังก์ชันสร้างคำตอบอัตโนมัติแทน
        const autoInterpretation = generateInterpretationFromTarotData(cards, question, category);
        return NextResponse.json({ interpretation: normalizeInterpretation(autoInterpretation) });
      }
    } catch (apiError) {
      console.error('API error:', apiError);

      // สร้างการตีความอัตโนมัติจากข้อมูลไพ่ที่มีอยู่
      console.log('Generating interpretation from tarot data...');
      const autoInterpretation = generateInterpretationFromTarotData(cards, question, category);
      
      return NextResponse.json({ interpretation: normalizeInterpretation(autoInterpretation) });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    
    // กรณีที่มีปัญหากับ request ให้ใช้ฟังก์ชันสร้างการตีความอัตโนมัติ
    try {
      // ถ้ามีข้อมูลไพ่ ให้ใช้ข้อมูลนั้น
      if (requestData && requestData.cards && requestData.question && requestData.category) {
        const autoInterpretation = generateInterpretationFromTarotData(
            requestData.cards, 
            requestData.question, 
            requestData.category
          );
          return NextResponse.json({ interpretation: normalizeInterpretation(autoInterpretation) });
        } 
        
        // ถ้าไม่มีข้อมูลเลย ใช้ข้อมูลตัวอย่าง
        const defaultInterpretation = {
          positionInterpretations: [
            {
              position: 1,
              card: "The Fool",
              title: "สถานการณ์ปัจจุบัน",
              meaning: "คุณกำลังอยู่ในช่วงเริ่มต้นของการเดินทางใหม่ มีพลังงานแห่งการเริ่มต้นและความกระตือรือร้น"
            },
            {
              position: 2,
              card: "Eight of Pentacles",
              title: "ความท้าทาย",
              meaning: "คุณต้องพัฒนาทักษะและความเชี่ยวชาญให้มากขึ้น ต้องอดทนและทุ่มเทเวลาให้กับการฝึกฝน"
            },
            {
              position: 3,
              card: "Three of Swords",
              title: "คำแนะนำ",
              meaning: "แม้จะเจ็บปวดหรือยากลำบาก แต่คุณต้องตัดสินใจอย่างเด็ดขาดและเดินหน้าต่อไป"
            },
            {
              position: 4,
              card: "The Hermit",
              title: "ผลลัพธ์",
              meaning: "คุณจะได้พบกับความเข้าใจที่ลึกซึ้งขึ้น การแยกตัวเพื่อใคร่ครวญชีวิตจะนำไปสู่การค้นพบที่สำคัญ"
            }
          ],
          summary: "ไพ่ทั้ง 4 ใบชี้ให้เห็นว่าคุณกำลังเริ่มต้นบทใหม่ในชีวิตที่จะพาคุณไปสู่การเติบโตและการเรียนรู้",
          advice: "เปิดใจรับโอกาสใหม่ๆ และมุ่งมั่นในการพัฒนาตัวเอง อย่ากลัวที่จะตัดสินใจอย่างเด็ดขาด"
        };
        
        return NextResponse.json({ interpretation: normalizeInterpretation(defaultInterpretation) });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return NextResponse.json(
          { error: `เกิดข้อผิดพลาด: ${error.message}` },
          { status: 500 }
        );
      }
    }
  }