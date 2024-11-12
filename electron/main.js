const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const log = require('electron-log');
const DatabaseService = require('./services/database.service');

// Configure logging
log.transports.file.level = 'info';
log.info('Application Starting...');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

async function createWindow() {
  try {
    // Initialize database
    await DatabaseService.init();
    log.info('Database initialized');

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    // Load the app
    mainWindow.loadURL(
      isDev 
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`
    );

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    // Backup database when window is closed
    mainWindow.on('close', async () => {
      try {
        await DatabaseService.backup();
        log.info('Database backup completed');
      } catch (error) {
        log.error('Database backup failed:', error);
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

  } catch (error) {
    log.error('Error during window creation:', error);
    app.quit();
  }
}

// App events
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  DatabaseService.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle database operations from renderer
ipcMain.handle('db-operation', async (event, { operation, ...params }) => {
  try {
    // Implement your database operations here
    switch (operation) {
      case 'getClienti':
        // Add implementation
        break;
      case 'getCollezioni':
        // Add implementation
        break;
      case 'getEventi':
        // Add implementation
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    log.error('Database operation failed:', error);
    throw error;
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  if (mainWindow) {
    mainWindow.webContents.send('error', error.message);
  }
});
