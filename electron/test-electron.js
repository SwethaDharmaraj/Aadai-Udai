console.log('Starting electron test...');
const electron = require('electron');
console.log('Electron loaded:', electron);
console.log('Electron app:', electron.app);

if (electron && electron.app) {
    console.log('SUCCESS: Electron is working!');
    electron.app.whenReady().then(() => {
        console.log('Electron app is ready!');
        electron.app.quit();
    });
} else {
    console.error('FAILED: Electron not loaded properly');
    process.exit(1);
}
