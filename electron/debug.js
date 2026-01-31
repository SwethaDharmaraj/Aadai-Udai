console.log('=== Electron Module Debug ===');
console.log('Node version:', process.version);
console.log('Process versions:', process.versions);

try {
    const electron = require('electron');
    console.log('\nElectron require result type:', typeof electron);
    console.log('Electron require result:', electron);

    if (typeof electron === 'object') {
        console.log('\nElectron object keys:', Object.keys(electron));
        if (electron.app) {
            console.log('SUCCESS: electron.app found!');
            electron.app.whenReady().then(() => {
                console.log('App is ready!');
                electron.app.quit();
            });
        } else {
            console.log('ERROR: electron.app is undefined');
            process.exit(1);
        }
    } else {
        console.log('ERROR: electron is not an object, it is:', typeof electron);
        process.exit(1);
    }
} catch (error) {
    console.error('ERROR requiring electron:', error);
    process.exit(1);
}
