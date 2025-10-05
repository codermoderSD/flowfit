import { NextResponse } from "next/server";

// Minimal API route so Next.js recognizes this file as a module.
// Extend these handlers as needed for timer persistence or analytics.

export async function GET() {
	return NextResponse.json({ ok: true, message: "Timer API root" });
}

export async function POST(request: Request) {
	try {
		const payload = await request.json();
		// Placeholder: handle timer events (start/stop/pause) or record analytics
		return NextResponse.json({ ok: true, received: payload });
	} catch (err) {
		return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
	}
}
