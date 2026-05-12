import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, platform, painPoint } = body;

    if (!name || !email || !platform) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const betaRequest = await prisma.betaRequest.create({
      data: {
        name,
        email,
        platform,
        painPoint: painPoint || null,
      },
    });

    return NextResponse.json({ success: true, id: betaRequest.id });
  } catch (error: unknown) {
    // Duplicate email — return a friendly message
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "You're already on the list!" },
        { status: 409 }
      );
    }
    console.error("[Beta Request Error]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
