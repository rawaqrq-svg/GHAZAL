import { contextBridge, ipcRenderer } from 'electron';

export interface PrintReceiptPayload {
  invoiceNumber: string;
  reference: string;
  cashierName: string;
  date: string;
  items: {
    name: string;
    shade?: string | null;
    quantity: number;
    unitPriceFils: number;
    totalFils: number;
  }[];
  subtotalFils: number;
  taxFils: number;
  discountFils: number;
  grossTotalFils: number;
  paymentMethod: string;
  amountTenderedFils?: number;
  changeDueFils?: number;
}

export interface DeviceConfig {
  terminalId: string;
  serverUrl: string;
  printerName?: string;
  autoKickDrawer: boolean;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Device Configuration
  getConfig: (): Promise<DeviceConfig> => ipcRenderer.invoke('get-device-config'),
  saveConfig: (cfg: DeviceConfig): Promise<boolean> => ipcRenderer.invoke('save-device-config', cfg),

  // Hardware APIs
  printReceipt: (payload: PrintReceiptPayload): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('print-receipt', payload),

  openCashDrawer: (): Promise<boolean> => ipcRenderer.invoke('open-cash-drawer'),

  // Printer List
  getPrinters: (): Promise<any[]> => ipcRenderer.invoke('get-system-printers'),

  // App Controls
  toggleFullscreen: (): Promise<void> => ipcRenderer.invoke('toggle-fullscreen'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  isDesktop: true
});
