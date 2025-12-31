import { ipcMain } from 'electron';
import teaPacketOrderService from '../services/teaPacketOrderService.js';

export function registerTeaPacketOrderHandlers() {
  ipcMain.handle('teaPacketOrder:getAll', () => teaPacketOrderService.getAll());
  ipcMain.handle('teaPacketOrder:getNextId', () => teaPacketOrderService.getNextId());
  ipcMain.handle('teaPacketOrder:add', (e, data) => teaPacketOrderService.add(data));
  ipcMain.handle('teaPacketOrder:update', (e, data) => teaPacketOrderService.update(data));
  ipcMain.handle('teaPacketOrder:delete', (e, id) => teaPacketOrderService.delete(id));
  console.log('✅ TeaPacketOrder IPC registered');
}
