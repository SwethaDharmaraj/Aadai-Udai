const { app, BrowserWindow } = require('electron');

console.log('Electron app loaded successfully!');
console.log('App version:', app.getVersion());

app.whenReady().then(() => {
    console.log('App is ready!');
    const win = new BrowserWindow({
        width: 800,
        height: 600
    });
    win.loadURL('https://www.google.com');
});

app.on('window-all-closed', () => {
    app.quit();
});
