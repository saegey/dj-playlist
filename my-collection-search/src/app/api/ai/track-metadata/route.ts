import { NextResponse } from "next/server";

// Uncomment and configure if you want to use OpenAI API
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `
${prompt}

Please analyze this track and return a JSON object **only**, in the following format:

{
  "key": "string",
  "bpm": "string",
  "genre": "string",
  "notes": "string"
}

Provide no explanation or extra text — only the JSON object.
`,
        },
      ],
      max_tokens: 300, // adjust if needed
    });

    const aiText = completion.choices[0].message?.content || "";

    // Remove code fences and trim whitespace
    const cleaned = aiText.replace(/```json|```/gi, "").trim();
    let extracted = { key: "", bpm: "", notes: "", genre: "" };
    try {
      extracted = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse JSON from AI response", err, { aiText });
    }

    const { key, bpm, notes, genre } = extracted;

    return NextResponse.json({ key, bpm, notes, genre });
  } catch (error) {
    console.error("Error fetching AI metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI metadata" },
      { status: 500 }
    );
  }
}
