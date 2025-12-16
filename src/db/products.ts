import { getPool } from "./mssql";

export async function getProducts() {
    const pool = await getPool();

    const result = await pool.request().query(`
    SELECT TOP 10000
      [ID] as id,
      [ItemCode] as itemCode,
      [ItemName] as itemName,
      [SalePrice] as price,
      [QtyBalance] as qty
    FROM [dbo].[Product]
    ORDER BY [ID] ASC
  `);

    return result.recordset;
}
