// src/main/index.js
import path from 'path';
import { fileURLToPath } from 'url';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import pkg from 'electron-updater';  // Fixed import
const { autoUpdater } = pkg;

// Database
import db from './database/connection.js';
import { createTables } from './database/schema.js';
import { seedData } from './database/seeds.js';

// Controllers
import { registerUserHandlers } from './controllers/userController.js';
import { registerCustomerHandlers } from './controllers/customerController.js';
import { registerEmployeeHandlers } from './controllers/employeeController.js';
import { registerTeaFactoryHandlers } from './controllers/teaFactoryController.js';
import { registerFertilizerInventoryHandlers } from './controllers/fertilizerInventoryController.js';
import { registerFertilizerOrderHandlers } from './controllers/fertilizerOrderController.js';
import { registerTeaPacketInventoryHandlers } from './controllers/teaPacketInventoryController.js';
import { registerRawTeaInventoryHandlers } from './controllers/rawTeaInventoryController.js';
import { registerMonthlyTeaRateHandlers } from './controllers/monthlytearateController.js';
import { registerTeaPacketOrderHandlers } from './controllers/teaPacketOrderController.js';
import { registerCustomerAdvanceHandlers } from './controllers/advanceController.js';
import { registerOtherAddHandlers } from './controllers/OtherAddController.js';
import { registerCustomerMonthlySummary } from './controllers/customermonthlysummrycontroller.js';
import { registerReportHandlers } from './controllers/reportController.js';

// registerHandlers() function එක ඇතුළේ



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    .then(() => mainWindow.webContents.openDevTools({ mode: 'detach' }));

  mainWindow.maximize();
  setTimeout(() => {
    console.log('🔄 Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();
  }, 5000);
  // Auto-update setup
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. Downloading now...'
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The app will restart to apply the update.'
    }).then(() => {
      autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('AutoUpdater error:', err);
  });
}

function registerHandlers() {
  registerUserHandlers();
  registerCustomerHandlers();
  registerEmployeeHandlers();
  registerTeaFactoryHandlers();
  registerFertilizerInventoryHandlers();
  registerFertilizerOrderHandlers();
  registerTeaPacketInventoryHandlers();
  registerRawTeaInventoryHandlers();
  registerMonthlyTeaRateHandlers();
  registerTeaPacketOrderHandlers();
  registerCustomerAdvanceHandlers();
  registerOtherAddHandlers();
  registerCustomerMonthlySummary();
  registerReportHandlers();

  console.log('✅ All handlers registered');
}

// App ready
app.whenReady().then(() => {
  try {
    console.log('App starting...');
    createTables();
    seedData();
    registerHandlers();
    createWindow();
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
