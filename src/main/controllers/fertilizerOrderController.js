import { ipcMain } from 'electron';
import fertilizerOrderService from '../services/fertilizerOrderService.js';

export function registerFertilizerOrderHandlers() {

  // ================= BASIC CRUD =================
  ipcMain.handle('fertilizerOrder:getAll', () => {
    return fertilizerOrderService.getAll();
  });

  ipcMain.handle('fertilizerOrder:getNextId', () => {
    return fertilizerOrderService.getNextId();
  });

  ipcMain.handle('fertilizerOrder:add', (e, data) => {
    return fertilizerOrderService.add(data);
  });

  ipcMain.handle('fertilizerOrder:update', (e, data) => {
    return fertilizerOrderService.update(data);
  });

  ipcMain.handle('fertilizerOrder:delete', (e, id) => {
    return fertilizerOrderService.delete(id);
  });

  // ================= CUSTOMER =================
  ipcMain.handle('fertilizerOrder:searchCustomer', (e, query) => {
    return fertilizerOrderService.searchCustomer(query);
  });

  // ================= TRANSPORT =================
  ipcMain.handle('fertilizerOrder:getTransportEmployees', () => {
    return fertilizerOrderService.getTransportEmployees();
  });

  // ================= INVENTORY =================
  ipcMain.handle('fertilizerOrder:getInventoryByType', (e, type) => {
    return fertilizerOrderService.getInventoryByType(type);
  });

  ipcMain.handle('fertilizerOrder:getInventoryDetails', (e, id) => {
    return fertilizerOrderService.getInventoryDetails(id);
  });

  console.log('✅ FertilizerOrder IPC handlers registered');
}
