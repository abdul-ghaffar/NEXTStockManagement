import { getPool } from "./mssql";

export async function getCategories() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT [ID] as id, [Name] as name, [Image] as image
        FROM [dbo].[Category]
        WHERE IsActive = 1
        ORDER BY [Name]
    `);
    return result.recordset;
}

export async function getProductsByCategory(categoryId: number) {
    const pool = await getPool();
    const result = await pool.request()
        .input('categoryId', categoryId)
        .query(`
        SELECT [ID] as id, [ItemCode] as itemCode, [ItemName] as itemName, [SalePrice] as price, [QtyBalance] as qty
        FROM [dbo].[Product]
        WHERE CategoryID = @categoryId AND ISActive = 1
        ORDER BY [ItemName]
    `);
    return result.recordset;
}
