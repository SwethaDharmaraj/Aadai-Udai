const { spawn } = require('child_process');
const path = require('path');

// Get the electron path
const electronPath = require('electron');

// Set NODE_ENV to development
process.env.NODE_ENV = 'development';

console.log('Starting Electron application...');
console.log('Electron path:', electronPath);

// Spawn electron process
const electronProcess = spawn(electronPath, [path.join(__dirname, '.')], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
});

electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    process.exit(code);
});
