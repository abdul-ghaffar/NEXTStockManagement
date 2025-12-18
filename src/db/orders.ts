import * as sql from "mssql";
import { getPool } from "./mssql";

export type OrderItem = {
    itemCode: string;
    qty: number;
    price: number;
    total?: number;
};

export type OrderData = {
    tableName: string;
    items: OrderItem[];
    netTotal: number;
    areaId?: number | null;
    orderType?: string;
    phone?: string;
    address?: string;
};

export async function createOrder(order: OrderData) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Insert into Sale table. Use columns that exist in your schema: ClientName, SaleDate, TotalAmount, AreaID (optional), OrderType, PhoneNo, DeliveryAddress
        const saleRequest = new sql.Request(transaction);
        saleRequest.input("ClientName", sql.NVarChar(200), order.tableName || "");
        saleRequest.input("SaleDate", sql.DateTime, new Date());
        saleRequest.input("TotalAmount", sql.Decimal(18, 2), order.netTotal || 0);
        saleRequest.input("AreaID", sql.BigInt, order.areaId ?? null);
        saleRequest.input("OrderType", sql.NVarChar(50), order.orderType || 'Dine In');
        saleRequest.input("PhoneNo", sql.NVarChar(50), order.phone || null);
        saleRequest.input("DeliveryAddress", sql.NVarChar(500), order.address || null);

        const saleResult = await saleRequest.query(`
            INSERT INTO [dbo].[Sale] (ClientName, SaleDate, TotalAmount, AreaID, OrderType, PhoneNo, DeliveryAddress)
            OUTPUT INSERTED.ID
            VALUES (@ClientName, @SaleDate, @TotalAmount, @AreaID, @OrderType, @PhoneNo, @DeliveryAddress)
        `);

        const saleID = saleResult.recordset && saleResult.recordset[0] ? saleResult.recordset[0].ID : null;

        if (!saleID) {
            await transaction.rollback();
            throw new Error('Failed to insert Sale');
        }

        // Mark the area/table as active (running) when a sale is created for it
        if (order.areaId) {
            const updReq = new sql.Request(transaction);
            updReq.input('AreaID', sql.BigInt, order.areaId);
            await updReq.query(`
                UPDATE [dbo].[Area]
                SET IsActive = 1
                WHERE ID = @AreaID
            `);
        }

        // Insert items into Sale_Item table (matches schema)
        for (const item of order.items) {
            const itemReq = new sql.Request(transaction);
            itemReq.input("SaleID", sql.BigInt, saleID);
            itemReq.input("ItemCode", sql.NVarChar(100), item.itemCode);
            itemReq.input("Qty", sql.Int, item.qty);
            itemReq.input("SalePrice", sql.Decimal(18, 2), item.price);

            // Note: your Sale_Item table does not contain a `Total` column per schema; insert only existing columns.
            await itemReq.query(`
                INSERT INTO [dbo].[Sale_Item] (SaleID, ItemCode, Qty, SalePrice)
                VALUES (@SaleID, @ItemCode, @Qty, @SalePrice)
            `);
        }

        await transaction.commit();
        return { success: true, saleID };

    } catch (err) {
        try {
            await transaction.rollback();
        } catch (_) {
            // ignore
        }
        console.error("Transaction Error:", err);
        throw err;
    }
}

export async function updateOrder(orderId: number, order: OrderData) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Update Sale header
        const updReq = new sql.Request(transaction);
        updReq.input('OrderID', sql.BigInt, orderId);
        updReq.input('ClientName', sql.NVarChar(200), order.tableName || '');
        updReq.input('SaleDate', sql.DateTime, new Date());
        updReq.input('TotalAmount', sql.Decimal(18, 2), order.netTotal || 0);
        updReq.input('AreaID', sql.BigInt, order.areaId ?? null);
        updReq.input("OrderType", sql.NVarChar(50), order.orderType || 'Dine In');
        updReq.input("PhoneNo", sql.NVarChar(50), order.phone || null);
        updReq.input("DeliveryAddress", sql.NVarChar(500), order.address || null);

        await updReq.query(`
            UPDATE [dbo].[Sale]
            SET ClientName = @ClientName,
                SaleDate = @SaleDate,
                TotalAmount = @TotalAmount,
                AreaID = @AreaID,
                OrderType = @OrderType,
                PhoneNo = @PhoneNo,
                DeliveryAddress = @DeliveryAddress
            WHERE ID = @OrderID
        `);

        // Delete existing items
        await new sql.Request(transaction).input('OrderID', orderId).query(`
            DELETE FROM [dbo].[Sale_Item] WHERE SaleID = @OrderID
        `);

        // Insert new items
        for (const item of order.items) {
            const itemReq = new sql.Request(transaction);
            itemReq.input('SaleID', sql.BigInt, orderId);
            itemReq.input('ItemCode', sql.NVarChar(100), item.itemCode);
            itemReq.input('Qty', sql.Int, item.qty);
            itemReq.input('SalePrice', sql.Decimal(18, 2), item.price);
            await itemReq.query(`
                INSERT INTO [dbo].[Sale_Item] (SaleID, ItemCode, Qty, SalePrice)
                VALUES (@SaleID, @ItemCode, @Qty, @SalePrice)
            `);
        }

        // Ensure area is marked active
        if (order.areaId) {
            await new sql.Request(transaction).input('AreaID', sql.BigInt, order.areaId).query(`
                UPDATE [dbo].[Area] SET IsActive = 1 WHERE ID = @AreaID
            `);
        }

        await transaction.commit();
        return { success: true, orderId };
    } catch (err) {
        try { await transaction.rollback(); } catch (_) { }
        console.error('Update order error:', err);
        throw err;
    }
}

export async function closeOrder(orderId: number) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Find the sale to get AreaID
        const saleReq = new sql.Request(transaction);
        saleReq.input('OrderID', sql.BigInt, orderId);
        const saleRes = await saleReq.query(`SELECT ID, AreaID FROM [dbo].[Sale] WHERE ID = @OrderID`);
        const saleRow = saleRes.recordset && saleRes.recordset[0];

        // Mark sale as closed
        await new sql.Request(transaction).input('OrderID', sql.BigInt, orderId).query(`
            UPDATE [dbo].[Sale]
            SET Closed = 1
            WHERE ID = @OrderID
        `);

        // If we have area id, mark area inactive
        if (saleRow && saleRow.AreaID) {
            await new sql.Request(transaction).input('AreaID', sql.BigInt, saleRow.AreaID).query(`
                UPDATE [dbo].[Area]
                SET IsActive = 0
                WHERE ID = @AreaID
            `);
        }

        await transaction.commit();
        return { success: true, orderId };
    } catch (err) {
        try { await transaction.rollback(); } catch (_) { }
        console.error('Close order error:', err);
        throw err;
    }
}

export async function getSales(page: number = 1, limit: number = 10, searchId?: string, orderType?: string, status?: string) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    let query = `
        SELECT [ID], [ClientName], [SaleDate], [TotalAmount], [OrderType], [PhoneNo], [DeliveryAddress], [Closed]
        FROM [dbo].[Sale]
        WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as Total FROM [dbo].[Sale] WHERE 1=1`;

    const request = pool.request();
    const countRequest = pool.request();

    if (searchId) {
        request.input('SearchId', sql.BigInt, searchId);
        countRequest.input('SearchId', sql.BigInt, searchId);
        query += ` AND ID = @SearchId`;
        countQuery += ` AND ID = @SearchId`;
    }

    if (orderType && orderType !== 'All') {
        request.input('OrderType', sql.NVarChar(50), orderType);
        countRequest.input('OrderType', sql.NVarChar(50), orderType);
        query += ` AND OrderType = @OrderType`;
        countQuery += ` AND OrderType = @OrderType`;
    }

    if (status && status !== 'All') {
        const isClosed = status === 'Closed' ? 1 : 0;
        request.input('IsClosed', sql.Bit, isClosed);
        countRequest.input('IsClosed', sql.Bit, isClosed);
        query += ` AND Closed = @IsClosed`;
        countQuery += ` AND Closed = @IsClosed`;
    }

    query += ` ORDER BY ID DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;
    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const result = await request.query(query);
    const countResult = await countRequest.query(countQuery);

    return {
        data: result.recordset,
        total: countResult.recordset[0].Total,
        page,
        totalPages: Math.ceil(countResult.recordset[0].Total / limit)
    };
}

export async function getOrder(id: number) {
    const pool = await getPool();

    // Get Sale
    const saleRes = await pool.request()
        .input('ID', sql.BigInt, id)
        .query(`SELECT * FROM [dbo].[Sale] WHERE ID = @ID`);

    const sale = saleRes.recordset[0];
    if (!sale) return null;

    // Get Items
    const itemsRes = await pool.request()
        .input('SaleID', sql.BigInt, id)
        .query(`
            SELECT SI.ItemCode, SI.Qty, SI.SalePrice as Price, P.ItemName, P.ID as ProductID 
            FROM [dbo].[Sale_Item] SI
            JOIN [dbo].[Product] P ON SI.ItemCode = P.ItemCode
            WHERE SI.SaleID = @SaleID
        `);

    return {
        sale,
        items: itemsRes.recordset.map(r => ({
            id: r.ProductID,
            itemCode: r.ItemCode,
            itemName: r.ItemName,
            price: r.Price,
            qty: r.Qty
        }))
    };
}
