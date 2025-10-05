import { NextRequest, NextResponse } from "next/server";
import { chadReply } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY is not set on the server" },
        { status: 500 }
      );
    }

    const response = await chadReply(message);

    return NextResponse.json({ response });
  } catch (error: unknown) {
    console.error("AI response error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate AI response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
