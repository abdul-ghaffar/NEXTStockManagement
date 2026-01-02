import * as sql from "mssql";
import { getPool } from "./mssql";

export type Settings = {
    PercentageServiceCharges?: number;
    FixDeliveryCharges?: number;
};

/**
 * Fetch settings from the Setting table
 */
export async function getSettings(): Promise<Settings> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TOP 1 
                PercentageServiceCharges, 
                FixDeliveryCharges 
            FROM [dbo].[Setting]
        `);

        if (result.recordset && result.recordset.length > 0) {
            const row = result.recordset[0];
            return {
                PercentageServiceCharges: row.PercentageServiceCharges || 0,
                FixDeliveryCharges: row.FixDeliveryCharges || 0
            };
        }

        // Return defaults if no settings found
        return {
            PercentageServiceCharges: 0,
            FixDeliveryCharges: 0
        };
    } catch (error) {
        console.error("Error fetching settings:", error);
        // Return defaults on error
        return {
            PercentageServiceCharges: 0,
            FixDeliveryCharges: 0
        };
    }
}
