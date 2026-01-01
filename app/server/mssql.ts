// import * as sql from "mssql";
// import customersInfo from "@/config/customersInfo.json";

// const activeProfile = "AkbarDB"; // later move to ENV
// const cfg = customersInfo[activeProfile];

// const config: sql.config = {
//     user: "sa",
//     password: "#ag@iffi.qazi",
//     server: cfg.Con_Name,
//     database: cfg.DB_Name,
//     options: {
//         encrypt: false,
//         trustServerCertificate: true,
//     },
//     pool: {
//         max: 10,
//         min: 0,
//         idleTimeoutMillis: 30000,
//     },
// };

// let poolPromise: Promise<sql.ConnectionPool> | null = null;

// export function getPool() {
//     if (!poolPromise) {
//         poolPromise = sql.connect(config);
//     }
//     return poolPromise;
// }


import "server-only";
import sql from "mssql";
import customersInfo from "@/config/customersInfo.json";

const activeProfile = "AbdulLaptop"; // only one profile now
const cfg = customersInfo[activeProfile];

// Support named instance in Con_Name like 'HOST\\INSTANCE' by splitting and setting options.instanceName
let serverName = cfg.Con_Name as string;
let instanceName: string | undefined = undefined;
if (serverName.includes("\\")) {
    const parts = serverName.split("\\");
    serverName = parts[0];
    instanceName = parts[1];
}

const config: sql.config = {
    user: 'sa',
    password: '#ag@iffi.qazi',
    server: serverName,
    database: cfg.DB_Name,
    // increase timeouts to avoid transient ETIMEOUTs during dev or slow networks
    connectionTimeout: 30000,
    requestTimeout: 60000,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        ...(instanceName ? { instanceName } : {})
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(config);
    }
    return poolPromise;
}
