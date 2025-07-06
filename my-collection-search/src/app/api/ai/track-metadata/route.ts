import { NextResponse } from 'next/server';

// Uncomment and configure if you want to use OpenAI API
// import { Configuration, OpenAIApi } from 'openai';
// const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // --- Real OpenAI implementation ---
    // const completion = await openai.createChatCompletion({
    //   model: 'gpt-3.5-turbo',
    //   messages: [{ role: 'user', content: prompt }],
    //   max_tokens: 100,
    // });
    // const aiText = completion.data.choices[0].message?.content || '';
    // // Parse aiText for key, bpm, notes (you may want to use regex or instruct GPT to return JSON)
    // return NextResponse.json({ key, bpm, notes });

    // --- Mocked response for now ---
    // Simulate AI response (replace with real call above)
    const mock = {
      key: 'C Minor',
      bpm: '124',
      notes: 'Great for deep house sets, smooth breakdown, works well in warmups.',
      local_tags: 'Deep House',
    };
    return NextResponse.json(mock);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch AI metadata' }, { status: 500 });
  }
}
