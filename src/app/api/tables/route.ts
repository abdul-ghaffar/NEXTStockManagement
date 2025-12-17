import { NextResponse } from "next/server";
import { getPool } from "@/db/mssql";

export async function GET() {
    try {
        const pool = await getPool();
        // For each area, try to find an open sale (Closed = 0). Use OUTER APPLY to fetch top 1 open sale per area.
        const result = await pool.request().query(`
            SELECT
                a.ID AS id,
                a.Name AS name,
                a.Remarks AS remarks,
                a.IsActive AS isActive,
                s.ID AS saleId,
                s.TotalAmount AS saleTotal
            FROM [dbo].[Area] a
            OUTER APPLY (
                SELECT TOP 1 ID, TotalAmount
                FROM [dbo].[Sale] s
                WHERE 
                    a.IsActive = 1              -- 🔹 only fetch sale when active
                    AND s.AreaID = a.ID
                    AND ISNULL(s.Closed, 0) = 0
                ORDER BY s.ID DESC
            ) s
            ORDER BY a.IsActive ASC, a.ID ASC;
        `);
        return NextResponse.json(result.recordset);
    } catch (err) {
        console.error('Tables API error:', err);
        return NextResponse.json({ message: 'Failed to load tables' }, { status: 500 });
    }
}
