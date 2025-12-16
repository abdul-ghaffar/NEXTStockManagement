import { NextResponse } from "next/server";
import { getPool } from "@/db/mssql";

export async function GET(request: Request, context: { params: any }) {
    try {
        // Next.js may provide params as a Promise in some runtimes; `await` handles both Promise and plain object.
        const params = await context.params;
        const orderId = parseInt(params.orderId, 10);
        if (Number.isNaN(orderId)) {
            return NextResponse.json({ message: 'Invalid order id' }, { status: 400 });
        }

        const pool = await getPool();

        const orderRes = await pool.request().input('orderId', orderId).query(`
            SELECT * FROM [dbo].[Sale] WHERE ID = @orderId
        `);

        const itemsRes = await pool.request().input('orderId', orderId).query(`
            SELECT si.*, p.ItemName, p.ID as prodID
            FROM [dbo].[Sale_Item] si
            LEFT JOIN [dbo].[Product] p ON p.ItemCode = si.ItemCode
            WHERE si.SaleID = @orderId
        `);

        return NextResponse.json({ order: orderRes.recordset[0] || null, items: itemsRes.recordset || [] });
    } catch (err) {
        console.error('Order detail API error:', err);
        return NextResponse.json({ message: 'Failed to load order' }, { status: 500 });
    }
}
