import { NextResponse } from "next/server";
import { getSettings } from "@/app/server/settings";

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Settings API Error:", error);
        return NextResponse.json(
            { message: `Failed to fetch settings: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
