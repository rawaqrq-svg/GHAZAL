import { app, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { ThermalPrinterService } from './printer-service';
import { DeviceConfig, PrintReceiptPayload } from './preload';

const CONFIG_PATH = path.join(app.getPath('userData'), 'ghazal-pos-config.json');

const DEFAULT_CONFIG: DeviceConfig = {
  terminalId: 'POS-TERMINAL-01',
  serverUrl: 'http://localhost:3000/pos/cashier',
  printerName: '',
  autoKickDrawer: true,
};

function loadConfig(): DeviceConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(cfg: DeviceConfig): boolean {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing config file:', err);
    return false;
  }
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const config = loadConfig();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'GHAZAL POS - كاشير غزل لمستحضرات التجميل',
    backgroundColor: '#1A1A1A',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Load configured Central Server POS URL
  mainWindow.loadURL(config.serverUrl).catch((err) => {
    console.error('Failed to load server URL, loading fallback offline screen:', err);
    mainWindow?.loadFile(path.join(__dirname, '../public/offline.html')).catch(() => {
      mainWindow?.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(`
        <html dir="rtl" style="font-family:sans-serif;text-align:center;padding:50px;background:#1A1A1A;color:#fff;">
          <h1 style="color:#E6007E;">تعذر الاتصال بالسيرفر المركزي</h1>
          <p>يرجى التأكد من تشغيل السيرفر على العنوان: ${config.serverUrl}</p>
          <button onclick="location.reload()" style="padding:10px 20px;background:#E6007E;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">إعادة المحاولة</button>
        </html>
      `)}`
      );
    });
  });

  // Shortcut registrations for Cashier Speed
  globalShortcut.register('F2', () => {
    mainWindow?.webContents.send('pos-shortcut', 'FOCUS_SEARCH');
  });

  globalShortcut.register('F4', () => {
    mainWindow?.webContents.send('pos-shortcut', 'TRIGGER_PAYMENT');
  });

  globalShortcut.register('F6', () => {
    mainWindow?.webContents.send('pos-shortcut', 'HOLD_SALE');
  });

  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------------
// IPC Handlers
// -------------------------------------------------------------

ipcMain.handle('get-device-config', async () => {
  return loadConfig();
});

ipcMain.handle('save-device-config', async (_event, cfg: DeviceConfig) => {
  return saveConfig(cfg);
});

ipcMain.handle('get-system-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('print-receipt', async (_event, payload: PrintReceiptPayload) => {
  const config = loadConfig();
  return await ThermalPrinterService.printThermalReceipt(payload, config.printerName);
});

ipcMain.handle('open-cash-drawer', async () => {
  // ESC/POS Cash Drawer Kick Pin 2 Pulse command: ESC p 0 25 250 (\x1B\x70\x00\x19\xFA)
  // In production, sent via raw driver or serial/USB port
  console.log('Sending Cash Drawer Kick signal...');
  return true;
});

ipcMain.handle('toggle-fullscreen', async () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});
