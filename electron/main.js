const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

let mainWindow;
let serverProcess;

function createWindow() {
    const isDev = !app.isPackaged;
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "TailAdmin POS",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../public/favicon.ico')
    });

    const url = isDev
        ? 'http://localhost:4001'
        : 'http://localhost:4001'; // In both cases we proxy to the next server

    if (isDev) {
        console.log("-----------------------------------------");
        console.log("ELECTRON: Starting in Development Mode");
        console.log("ELECTRON: Waiting for Next.js (http://localhost:4001)...");
        console.log("-----------------------------------------");

        // Wait for the dev server to be ready before loading the URL
        waitOn({
            resources: ['http://localhost:4001'],
            timeout: 60000,
            interval: 1000,
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            },
        }).then(() => {
            console.log("ELECTRON: Next.js is READY! Loading window...");
            mainWindow.loadURL(url);
            mainWindow.webContents.openDevTools();
        }).catch((err) => {
            console.error("ELECTRON ERROR: Could not connect to Next.js within 60s.");
            console.error("Check if 'pnpm run dev' is failing in your terminal.");
        });
    } else {
        // Start Next.js production server
        startNextServer(() => {
            mainWindow.loadURL(url);
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startNextServer(callback) {
    console.log("Starting Next.js server...");

    const appPath = app.getAppPath();
    const resourcesPath = process.resourcesPath;

    // In production, the node_modules are often not included in the asar if we use certain configurations
    // or we use the standalone build. But for now we assume they are in the asar.
    const nextBin = path.join(appPath, 'node_modules', '.bin', 'next');

    // We specify the CWD as appPath so it finds the .next folder
    // But we might need to copy .env to the resources folder and tell Next to use it
    const envPath = path.join(resourcesPath, '.env');

    serverProcess = spawn('node', [nextBin, 'start', '-p', '4001'], {
        cwd: appPath,
        env: {
            ...process.env,
            NODE_ENV: 'production',
            // We can try to force the env file if needed, but Next.js usually looks in CWD
            // If we are in asar, Next.js might struggle. 
        }
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`Next.js: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`Next.js Error: ${data}`);
    });

    // Wait for the server to be ready before loading the URL
    waitOn({
        resources: ['http://localhost:4001'],
        timeout: 30000
    }).then(() => {
        console.log("Next.js server is ready!");
        callback();
    }).catch((err) => {
        console.error("Failed to start Next.js server:", err);
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Clean up server process on exit
app.on('will-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
