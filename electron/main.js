const { app, BrowserWindow, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Aadai Udai - Premium Dress Shop",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Temporarily disabled to help with Razorpay/file origin issues
    },
    icon: path.join(__dirname, '../client/public/favicon.svg'),
    autoHideMenuBar: true,
  });

  // Log renderer console to terminal
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER-CONSOLE] ${message} (at ${sourceId}:${line})`);
  });

  // Handle Razorpay Origin/Referer issue in Electron
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://api.razorpay.com/*', 'https://checkout.razorpay.com/*'] },
    (details, callback) => {
      details.requestHeaders['Origin'] = 'https://checkout.razorpay.com';
      details.requestHeaders['Referer'] = 'https://checkout.razorpay.com';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Handle Razorpay/External links opening
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://api.razorpay.com') || url.includes('razorpay')) {
      return { action: 'allow' };
    }
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the built client app
  mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));

  // Open DevTools if you want to see errors
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

