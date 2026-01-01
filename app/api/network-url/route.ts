import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
    function getLocalIP() {
        const interfaces = os.networkInterfaces();
        for (const interfaceName in interfaces) {
            const networkInterface = interfaces[interfaceName];
            if (networkInterface) {
                for (const details of networkInterface) {
                    if (details.family === "IPv4" && !details.internal) {
                        return details.address;
                    }
                }
            }
        }
        return "localhost";
    }

    const ip = getLocalIP();
    const url = `http://${ip}:4001`;

    return NextResponse.json({ url });
}
