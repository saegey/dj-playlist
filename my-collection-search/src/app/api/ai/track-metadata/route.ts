import { NextResponse } from "next/server";

// Uncomment and configure if you want to use OpenAI API
import OpenAI from "openai";
import { getTrackMetadataPromptForFriend } from "@/lib/serverPrompts";

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { prompt, friend_id } = await req.json();
    const systemPrompt = await getTrackMetadataPromptForFriend(
      typeof friend_id === "number" ? friend_id : undefined
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      // temperature: 0.3,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `
${prompt}

Please analyze this track and return a JSON object **only**, in the following format:
{
  "genre": "string",
  "notes": "string"
}

In \"notes\", include a longer DJ-focused description with vibe, energy, suggested set placement, transition tips, and any emotional or cultural context. Provide no explanation or extra text — only the JSON object.
          `,
        },
      ],
      max_tokens: 500, // increase for longer notes and more fields
    });

    const aiText = completion.choices[0].message?.content || "";
    // Remove code fences and trim whitespace
    let cleaned = aiText.replace(/```json|```/gi, "").trim();
    // Try to extract the JSON object using regex (handles extra text)
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) cleaned = match[0];
    // Remove any trailing commas before closing braces
    cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    let extracted = { notes: "", genre: "" };
    try {
      extracted = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse JSON from AI response", err, {
        aiText,
        cleaned,
      });
      // Attempt to repair common JSON issues (unescaped quotes, unterminated strings, stray newlines)
      // Remove backslashes before quotes that are not escaping another backslash
      const repaired = cleaned.replace(/\\+"/g, '"');
      try {
        extracted = JSON.parse(repaired);
      } catch (err2) {
        console.error(
          "Failed to parse JSON from AI response after repair",
          err2,
          { aiText, cleaned, repaired }
        );
      }
    }

    const { notes, genre } = extracted;
    return NextResponse.json({ notes, genre });
  } catch (error) {
    console.error("Error fetching AI metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI metadata" },
      { status: 500 }
    );
  }
}
