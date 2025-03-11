// app/api/reading/route.js
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// สร้าง OpenAI client ที่ชี้ไปที่ OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function POST(request) {
  let requestData;
  try {
    // เก็บข้อมูลคำขอไว้ใน scope ที่กว้างขึ้น
    requestData = await request.json();
    const { question, category, cards } = requestData;
    
    if (!question || !category || !cards || cards.length !== 4) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }
    
    // สร้าง prompt
    const prompt = `
      คุณเป็นหมอดูไพ่ทาโรต์/ยิปซีที่เชี่ยวชาญและมีประสบการณ์มากกว่า 30 ปี
      
      คำถามของผู้ขอรับการดูไพ่: "${question}"
      หมวดหมู่: ${category}

      ไพ่ที่ผู้ขอรับการดูไพ่ได้เลือกมา 4 ใบ ตามลำดับตำแหน่ง:
      
      ตำแหน่งที่ 1 (สถานการณ์ปัจจุบัน): ${cards[0].name} (${cards[0].nameTh})
      ตำแหน่งที่ 2 (อุปสรรคหรือสิ่งท้าทาย): ${cards[1].name} (${cards[1].nameTh})
      ตำแหน่งที่ 3 (คำแนะนำหรือแนวทางแก้ไข): ${cards[2].name} (${cards[2].nameTh})
      ตำแหน่งที่ 4 (ผลลัพธ์หรือแนวโน้มในอนาคต): ${cards[3].name} (${cards[3].nameTh})

      กรุณาวิเคราะห์ความหมายของไพ่แต่ละใบตามตำแหน่ง พร้อมทั้งให้คำแนะนำและสรุปภาพรวม
      
      โปรดตอบในรูปแบบ JSON ตามนี้:
      {
        "positionInterpretations": [
          {
            "position": 1,
            "card": "ชื่อไพ่",
            "title": "หัวข้อสั้นๆ",
            "meaning": "ความหมายของไพ่ในตำแหน่งนี้..."
          },
          {
            "position": 2,
            "card": "ชื่อไพ่",
            "title": "หัวข้อสั้นๆ",
            "meaning": "ความหมายของไพ่ในตำแหน่งนี้..."
          },
          {
            "position": 3,
            "card": "ชื่อไพ่",
            "title": "หัวข้อสั้นๆ",
            "meaning": "ความหมายของไพ่ในตำแหน่งนี้..."
          },
          {
            "position": 4,
            "card": "ชื่อไพ่",
            "title": "หัวข้อสั้นๆ",
            "meaning": "ความหมายของไพ่ในตำแหน่งนี้..."
          }
        ],
        "summary": "สรุปภาพรวมจากไพ่ทั้ง 4 ใบ...",
        "advice": "คำแนะนำสำหรับผู้รับการดูไพ่..."
      }

      คำอธิบายต้องเหมาะสมกับคำถามและหมวดหมู่ มีความละเอียด ลึกซึ้ง และเป็นประโยชน์ และเป็นภาษาไทย
    `;

    // เพิ่ม HTTP headers ที่จำเป็นสำหรับ OpenRouter
    const headers = {
      "HTTP-Referer": "https://your-website-url.com", 
      "X-Title": "Tarot AI App"
    };

    try {
      // เรียกใช้ OpenRouter API
      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
        headers: headers
      });

      // ลอง debug ดูข้อมูลที่ได้รับก่อนแปลงเป็น JSON
      console.log("API Response:", completion.choices[0].message.content);

      // พยายามแปลง JSON
      const responseText = completion.choices[0].message.content;
      const interpretation = JSON.parse(responseText);
      return NextResponse.json({ interpretation });
    } catch (apiError) {
      console.error('API or JSON parsing error:', apiError);
      // ถ้ามีปัญหากับ API หรือการแปลง JSON ให้ใช้ข้อมูลจำลอง
      const mockInterpretation = getMockInterpretation(
        requestData.cards, 
        requestData.question, 
        requestData.category
      );
      return NextResponse.json({ interpretation: mockInterpretation });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    
    // กรณีที่มีปัญหากับ request
    const mockInterpretation = requestData 
      ? getMockInterpretation(requestData.cards, requestData.question, requestData.category)
      : getDefaultMockInterpretation();
      
    return NextResponse.json({ interpretation: mockInterpretation });
  }
}

// ฟังก์ชันสำหรับข้อมูลจำลองกรณีที่มีข้อมูลครบ
function getMockInterpretation(cards, question, category) {
  return {
    positionInterpretations: [
      {
        position: 1,
        card: cards[0].name,
        title: "สถานการณ์ปัจจุบันของคุณ",
        meaning: `ไพ่ ${cards[0].nameTh} ในตำแหน่งนี้แสดงถึงสถานการณ์ปัจจุบันของคุณที่เกี่ยวข้องกับ "${question}" คุณกำลังอยู่ในช่วงเริ่มต้นของโอกาสใหม่ๆ มีพลังงานแห่งการเริ่มต้นและความกระตือรือร้น`
      },
      {
        position: 2,
        card: cards[1].name,
        title: "สิ่งที่ท้าทายคุณ",
        meaning: `ไพ่ ${cards[1].nameTh} ในตำแหน่งนี้แสดงถึงความท้าทายที่คุณกำลังเผชิญ คุณต้องพัฒนาทักษะและความเชี่ยวชาญให้มากขึ้น ต้องอดทนและทุ่มเทเวลาให้กับการฝึกฝน`
      },
      {
        position: 3,
        card: cards[2].name,
        title: "คำแนะนำที่จะช่วยคุณ",
        meaning: `ไพ่ ${cards[2].nameTh} ในตำแหน่งนี้แนะนำว่า แม้จะเจ็บปวดหรือยากลำบาก แต่คุณต้องตัดสินใจอย่างเด็ดขาดและเดินหน้าต่อไป บางครั้งการปล่อยวางความคิดหรือมุมมองเดิมๆ จะช่วยให้คุณก้าวไปข้างหน้าได้`
      },
      {
        position: 4,
        card: cards[3].name,
        title: "ผลลัพธ์ที่เป็นไปได้",
        meaning: `ไพ่ ${cards[3].nameTh} ในตำแหน่งนี้ชี้ให้เห็นว่า คุณจะได้พบกับความเข้าใจที่ลึกซึ้งขึ้น บางครั้งการแยกตัวเพื่อใคร่ครวญชีวิตเป็นสิ่งจำเป็นเพื่อค้นพบปัญญาภายใน`
      }
    ],
    summary: `สำหรับคำถามเกี่ยวกับ "${question}" ในหมวดหมู่ ${category} ไพ่ทั้ง 4 ใบชี้ให้เห็นว่าคุณกำลังเริ่มต้นบทใหม่ในชีวิตที่จะพาคุณไปสู่การเติบโตและการเรียนรู้ มีความท้าทายในการพัฒนาทักษะ แต่หากคุณกล้าตัดสินใจและมุ่งมั่น คุณจะได้พบกับปัญญาและความเข้าใจที่ลึกซึ้ง`,
    advice: "เปิดใจรับโอกาสใหม่ๆ และมุ่งมั่นในการพัฒนาตัวเอง อย่ากลัวที่จะตัดสินใจอย่างเด็ดขาดเมื่อจำเป็น และหาเวลาใคร่ครวญถึงประสบการณ์ของคุณเพื่อค้นพบความจริงที่ลึกซึ้ง"
  };
}

// ฟังก์ชันสำหรับข้อมูลจำลองกรณีที่ไม่มีข้อมูลเลย
function getDefaultMockInterpretation() {
  return {
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
    summary: "ไพ่ทั้ง 4 ใบชี้ให้เห็นว่าคุณกำลังเริ่มต้นบทใหม่ในชีวิตที่จะพาคุณไปสู่การเติบโตและการเรียนรู้ มีความท้าทายในการพัฒนาทักษะ แต่หากคุณกล้าตัดสินใจและมุ่งมั่น คุณจะได้พบกับปัญญาและความเข้าใจที่ลึกซึ้ง",
    advice: "เปิดใจรับโอกาสใหม่ๆ และมุ่งมั่นในการพัฒนาตัวเอง อย่ากลัวที่จะตัดสินใจอย่างเด็ดขาดเมื่อจำเป็น และหาเวลาใคร่ครวญถึงประสบการณ์ของคุณเพื่อค้นพบความจริงที่ลึกซึ้ง"
  };
}