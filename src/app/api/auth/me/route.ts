import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    // In app routes, we can read cookies via NextResponse? We will parse cookie header instead
    // Note: this handler runs server-side where Request isn't available directly in this signature,
    // but Next exposes cookies via headers in the runtime. We'll read from global headers.
    // Use experimental approach: create NextResponse and read cookies from it is not ideal.
    // Simpler: access cookies via Request object by exporting default, but app-route GET receives no args.
    return NextResponse.json({ message: "Method not supported" }, { status: 405 });
  } catch (err) {
    console.error("/api/auth/me error:", err);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenPair = cookieHeader.split(";").map(s => s.trim()).find(s => s.startsWith("ta_token="));
    if (!tokenPair) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    const token = tokenPair.split("=").slice(1).join("=");
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("/api/auth/me error:", err);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
