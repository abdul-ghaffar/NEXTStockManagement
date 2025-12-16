import { NextResponse } from "next/server";
import { getPool } from "@/db/mssql";

export async function GET() {
    try {
        const pool = await getPool();
        // For each area, try to find an open sale (Closed = 0). Use OUTER APPLY to fetch top 1 open sale per area.
        const result = await pool.request().query(`
            SELECT
                a.ID as id,
                a.Name as name,
                a.Remarks as remarks,
                a.IsActive as isActive,
                s.ID as saleId,
                s.TotalAmount as saleTotal
            FROM [dbo].[Area] a
            OUTER APPLY (
                SELECT TOP 1 ID, TotalAmount
                FROM [dbo].[Sale] s
                WHERE s.AreaID = a.ID AND ISNULL(s.Closed, 0) = 0
                ORDER BY s.ID DESC
            ) s
            ORDER BY a.IsActive ASC, a.ID ASC
        `);
        return NextResponse.json(result.recordset);
    } catch (err) {
        console.error('Tables API error:', err);
        return NextResponse.json({ message: 'Failed to load tables' }, { status: 500 });
    }
}
