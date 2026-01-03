import { NextResponse } from "next/server";
import { getPool } from "@/app/server/mssql";

export async function GET() {
    try {
        const pool = await getPool();
        // For each area, try to find an open sale (Closed = 0). Use OUTER APPLY to fetch top 1 open sale per area.
        // Compute displayed sale total to include service (dispatch) or delivery charges.
        const result = await pool.request().query(`
            SELECT
                a.ID AS id,
                a.Name AS name,
                a.Remarks AS remarks,
                a.IsActive AS isActive,
                s.saleId,
                s.saleTotal,
                s.rawTotalAmount,
                s.createdBy,
                s.userId
            FROM [dbo].[Area] a
            OUTER APPLY (
                SELECT TOP 1
                    s.ID AS saleId,
                    -- raw total from sale header
                    s.TotalAmount AS rawTotalAmount,
                    -- compute displayed total including dispatch (percentage) or delivery charges (fixed)
                    (
                        CAST(ISNULL(s.TotalAmount, 0) AS DECIMAL(18,2))
                        + CASE
                            WHEN s.OrderType = 'Dine In' AND ISNULL(s.DispatchAmount, 0) > 0
                                THEN (CAST(ISNULL(s.TotalAmount, 0) AS DECIMAL(18,2)) * (CAST(ISNULL(s.DispatchAmount, 0) AS DECIMAL(18,2)) / 100.0))
                            WHEN s.OrderType = 'Home Delivery'
                                THEN CAST(ISNULL(s.DeliveryCharges, 0) AS DECIMAL(18,2))
                            ELSE 0
                          END
                    ) AS saleTotal,
                    ul.Name AS createdBy,
                    s.UserID AS userId
                FROM [dbo].[Sale] s
                LEFT JOIN [dbo].[UserLogin] ul ON ul.ID = s.UserID
                WHERE
                    a.IsActive = 1
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
