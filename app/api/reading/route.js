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

// ฟังก์ชันสำหรับสร้างการตีความที่เป็นค่าเริ่มต้น
function createDefaultInterpretation(cards) {
  return {
    positionInterpretations: [
      {
        position: 1,
        card: cards[0].name,
        title: "สถานการณ์ปัจจุบัน",
        meaning: "คุณกำลังอยู่ในช่วงที่ต้องใช้ความสมดุลทางอารมณ์ ควบคุมความรู้สึกและใช้เหตุผลในการตัดสินใจ"
      },
      {
        position: 2,
        card: cards[1].name,
        title: "ความท้าทาย",
        meaning: "คุณต้องเผชิญกับสถานการณ์ที่ต้องร่วมมือกับผู้อื่น การประสานงานและความเข้าใจเป็นสิ่งสำคัญ"
      },
      {
        position: 3,
        card: cards[2].name,
        title: "คำแนะนำ",
        meaning: "การรักษาสมดุลและความยืดหยุ่นเป็นสิ่งสำคัญ ปรับตัวตามสถานการณ์และเปิดใจรับฟัง"
      },
      {
        position: 4,
        card: cards[3].name,
        title: "ผลลัพธ์",
        meaning: "คุณจะพบโอกาสใหม่และแรงบันดาลใจที่นำไปสู่ความก้าวหน้าและการเติบโต"
      }
    ],
    summary: "การเดินทางนี้ต้องการความสมดุลและการทำงานร่วมกับผู้อื่น เมื่อคุณจัดการกับความท้าทายได้ จะพบโอกาสใหม่",
    advice: "รักษาสมดุลทางอารมณ์ เปิดใจทำงานร่วมกับผู้อื่น และมีความยืดหยุ่นในการปรับตัว"
  };
}

export async function POST(request) {
  let requestData;
  try {
    // เก็บข้อมูลคำขอไว้ใน scope ที่กว้างขึ้น
    requestData = await request.json();
    const { question, category, cards } = requestData;
    
    console.log("Question received:", question);
console.log("Category received:", category);

    // ตรวจสอบข้อมูลพื้นฐาน
    if (!question || !category || !cards || cards.length !== 4) {
      console.error('Missing basic data', { question, category, cardsLength: cards?.length });
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // พิมพ์ข้อมูลการ์ดทั้งหมดเพื่อตรวจสอบ
    console.log("Cards data being processed:", JSON.stringify(cards.map(card => ({
      name: card.name,
      nameTh: card.nameTh,
      position: card.position
    })), null, 2));
    // สร้างพรอมต์ที่กระชับและมีรายละเอียดเพียงพอ
  // ปรับพรอมต์ให้ได้ผลลัพธ์ที่มีคุณภาพดีขึ้น แต่ยังคงกระชับ
  const prompt = `
  คุณเป็นนักพยากรณ์ไพ่ทาโรต์และไพ่ยิปซีผู้เชี่ยวชาญกว่า 30 ปี ที่มีชื่อเสียงในการตีความไพ่อย่างแม่นยำ
  กำลังวิเคราะห์ไพ่ให้กับลูกค้าที่มีคำถามเฉพาะเจาะจงว่า:
  
  "${question}" (หมวดหมู่: ${category})
  
  ไพ่ที่ลูกค้าเลือก:
  1. (สถานการณ์ปัจจุบันของลูกค้า): ${cards[0].name} (${cards[0].nameTh})
  2. (อุปสรรคหรือสิ่งท้าทายที่ลูกค้ากำลังเผชิญ): ${cards[1].name} (${cards[1].nameTh}) 
  3. (คำแนะนำหรือแนวทางแก้ไขสำหรับลูกค้า): ${cards[2].name} (${cards[2].nameTh})
  4. (ผลลัพธ์หรือแนวโน้มในอนาคตหากลูกค้าทำตามคำแนะนำ): ${cards[3].name} (${cards[3].nameTh})
  
  ให้ทำการวิเคราะห์ความหมายของไพ่แต่ละใบโดยเชื่อมโยงกับคำถามของลูกค้าอย่างตรงประเด็น
  คุณมีความเชี่ยวชาญในการตีความความสัมพันธ์ระหว่างไพ่และสามารถให้คำแนะนำที่เป็นประโยชน์แก่ลูกค้าได้
  
  ในการตีความ ให้คุณทำสิ่งต่อไปนี้:
  1. พิจารณาความหมายของไพ่แต่ละใบในตำแหน่งที่ปรากฏ
  2. เชื่อมโยงความหมายของไพ่เข้ากับคำถามและสถานการณ์ของลูกค้า
  3. วิเคราะห์ความสัมพันธ์ระหว่างไพ่ทั้ง 4 ใบ
  4. ให้คำแนะนำที่เป็นรูปธรรมและนำไปปฏิบัติได้จริง
  
  ตอบเป็น JSON ตามรูปแบบนี้:
  {
    "positionInterpretations": [
      {
        "position": 1,
        "card": "${cards[0].name}",
        "title": "สถานการณ์ปัจจุบัน",
        "meaning": "อธิบายความหมายของไพ่ ${cards[0].nameTh} ในตำแหน่งนี้และเชื่อมโยงกับคำถาม สั้น ๆ ไม่เกิน 1-2 ประโยค"
      },
      {
        "position": 2,
        "card": "${cards[1].name}",
        "title": "อุปสรรคหรือสิ่งท้าทาย",
        "meaning": "อธิบายความหมายของไพ่ ${cards[1].nameTh} ในตำแหน่งนี้และเชื่อมโยงกับคำถาม สั้น ๆ ไม่เกิน 1-2 ประโยค"
      },
      {
        "position": 3,
        "card": "${cards[2].name}",
        "title": "คำแนะนำหรือแนวทางแก้ไข",
        "meaning": "อธิบายความหมายของไพ่ ${cards[2].nameTh} ในตำแหน่งนี้และเชื่อมโยงกับคำแนะนำที่ตรงกับคำถาม สั้น ๆ ไม่เกิน 1-2 ประโยค"
      },
      {
        "position": 4, 
        "card": "${cards[3].name}",
        "title": "ผลลัพธ์หรือแนวโน้มในอนาคต",
        "meaning": "อธิบายความหมายของไพ่ ${cards[3].nameTh} ในตำแหน่งนี้และเชื่อมโยงกับผลลัพธ์ที่เกี่ยวข้องกับคำถาม สั้น ๆ ไม่เกิน 1-2 ประโยค"
      }
    ],
    "summary": "สรุปภาพรวมของไพ่ทั้ง 4 ใบและเชื่อมโยงกับคำถามของลูกค้าโดยตรง แต่ต้องกระชับ",
    "advice": "คำแนะนำที่เป็นรูปธรรม ปฏิบัติได้จริง และตรงกับคำถามของลูกค้า แต่ต้องกระชับ"
  }
  
  สำคัญมาก:
  1. การตีความต้องตรงกับคำถามและหมวดหมู่ของคำถาม
  2. ให้คำอธิบายที่มีความหมายและเข้าใจง่าย
  3. ตอบตรงประเด็นและเฉพาะเจาะจงกับคำถามที่ลูกค้าถาม
  4. ให้คำแนะนำที่ปฏิบัติได้จริงและเป็นประโยชน์
  `;

      // เพิ่ม HTTP headers สำหรับ OpenRouter
      const headers = {
        "HTTP-Referer": "https://tarot-8z5e.onrender.com/", 
        "X-Title": "Tarot AI App"
      };
  
      try {
// ปรับปรุงการเรียกใช้ API โดยเพิ่ม token และปรับ temperature
const completion = await openai.chat.completions.create({
  model: "anthropic/claude-3-haiku", // เปลี่ยนเป็น GPT-4 เพื่อให้ได้ผลลัพธ์ที่ดีขึ้น (ถ้า OpenRouter สนับสนุน)
  messages: [{ role: "user", content: prompt }],
  temperature: 0.5, // เพิ่ม temperature ให้มีความคิดสร้างสรรค์มากขึ้น
  response_format: { type: "json_object" },
  max_tokens: 1500, // เพิ่ม token เพื่อให้ได้คำตอบที่ละเอียดขึ้น
  headers: headers
});
  
        // ตรวจสอบการตอบกลับจาก API
        if (!completion || !completion.choices || completion.choices.length === 0) {
          console.error('Invalid API response:', completion);
          throw new Error('ไม่ได้รับการตอบกลับที่ถูกต้องจาก API');
        }
  
        // ข้อมูลที่ได้รับจาก API
        console.log("API Response:", completion.choices[0].message.content);
  
        try {
          // แปลง JSON response
          const interpretation = JSON.parse(completion.choices[0].message.content);
          
          // ตรวจสอบว่า JSON มีโครงสร้างที่ถูกต้อง
          if (!interpretation.positionInterpretations || 
              !Array.isArray(interpretation.positionInterpretations) || 
              interpretation.positionInterpretations.length !== 4) {
            console.warn('รูปแบบข้อมูลไม่สมบูรณ์, กำลังแก้ไข...');
            
            // ใช้การตีความเริ่มต้นถ้าข้อมูลไม่ครบถ้วน
            return NextResponse.json({ interpretation: normalizeInterpretation(createDefaultInterpretation(cards)) });
          }
          

          
          return NextResponse.json({ interpretation: normalizeInterpretation(interpretation) });
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          
          // ใช้การตีความเริ่มต้นถ้าไม่สามารถแปลง JSON ได้
          return NextResponse.json({ interpretation: normalizeInterpretation(createDefaultInterpretation(cards)) });
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // ใช้การตีความเริ่มต้นถ้า API มีปัญหา
        return NextResponse.json({ interpretation: normalizeInterpretation(createDefaultInterpretation(cards)) });
      }
    } catch (error) {
      console.error('Request processing error:', error);
      
      // กรณีที่มีปัญหากับ request
      return NextResponse.json(
        { error: `เกิดข้อผิดพลาด: ${error.message}` },
        { status: 500 }
      );
    }
  }