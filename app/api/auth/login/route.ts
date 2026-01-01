import { NextResponse } from "next/server";
import { getPool } from "@/app/server/mssql";
import sql from "mssql";
import { signToken } from "@/lib/jwt";

function parseUserRow(row: any) {
  return {
    ID: row.ID,
    Name: row.Name,
    IsAdmin: row.IsAdmin ? 1 : 0,
    ClientTypeID: row.ClientTypeID ?? null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = body || {};
    if (!name || !password) return NextResponse.json({ message: "Missing credentials" }, { status: 400 });

    const pool = await getPool();
    const req = new sql.Request(pool);
    req.input("Name", sql.NVarChar(200), name);
    req.input("Password", sql.NVarChar(200), password);

    const res = await req.query(`SELECT TOP (1) ID, Name, Password, IsAdmin, ClientTypeID FROM [dbo].[UserLogin] WHERE Name = @Name AND Password = @Password`);
    const row = res.recordset && res.recordset[0];
    if (!row) return NextResponse.json({ message: "Invalid name or password" }, { status: 401 });

    const user = parseUserRow(row);

    // Sign JWT containing minimal identity
    const token = signToken(user);

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set({ name: "ta_token", value: token, httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 8 });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
