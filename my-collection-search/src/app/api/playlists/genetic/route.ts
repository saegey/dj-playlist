import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Received data for genetic optimization:", data);
    const res = await fetch(`http://192.168.2.98:8003/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracks: data.playlist,
      }),
    });
    const responseText = await res.json()
    // console.log("Genetic optimization response:", responseText);
    return NextResponse.json(responseText, { status: 201 });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
