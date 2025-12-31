// src/main/controllers/rawTeaInventoryController.js
import { ipcMain } from 'electron';
import rawTeaInventoryService from '../services/rawTeaInventoryService.js';

export function registerRawTeaInventoryHandlers() {
  ipcMain.handle('rawtea:getAll', () => rawTeaInventoryService.getAll());
  ipcMain.handle('rawtea:getNextId', () => rawTeaInventoryService.getNextId());
  ipcMain.handle('rawtea:add', (event, data) => rawTeaInventoryService.add(data));
  ipcMain.handle('rawtea:update', (event, data) => rawTeaInventoryService.update(data));
  ipcMain.handle('rawtea:delete', (event, id) => rawTeaInventoryService.delete(id));
  ipcMain.handle('rawtea:searchCustomer', (event, query) => rawTeaInventoryService.searchCustomer(query));
  ipcMain.handle('rawtea:getTransportEmployees', () => rawTeaInventoryService.getTransportEmployees());
  ipcMain.handle('rawtea:getMonthlyData', (event, year, month) => {
    return rawTeaInventoryService.getMonthlyData(year, month);
  });

  console.log('✅ Raw Tea Inventory handlers registered');
}