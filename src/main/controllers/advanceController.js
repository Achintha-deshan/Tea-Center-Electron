// src/main/controllers/customerAdvanceController.js

import { ipcMain } from 'electron';
import customerAdvanceService from '../services/advanceService.js'; // ⚠️ Fixed path

export function registerCustomerAdvanceHandlers() {

  // ================= Get All =================
  ipcMain.handle('advance:getAll', async () => {
    return customerAdvanceService.getAll();
  });

  // ================= Get Next ID =================
  ipcMain.handle('advance:getNextId', async () => {
    return customerAdvanceService.generateNextId(); // ⚠️ Fixed method name
  });

  // ================= Add =================
  ipcMain.handle('advance:add', async (e, data) => {
    try {
      return customerAdvanceService.add(data);
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // ================= Update =================
  ipcMain.handle('advance:update', async (e, data) => {
    try {
      return customerAdvanceService.update(data);
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // ================= Delete =================
  ipcMain.handle('advance:delete', async (e, advanceId) => {
    try {
      return customerAdvanceService.delete(advanceId);
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // ================= Get By Customer =================
  ipcMain.handle('advance:getByCustomer', async (e, customerId) => {
    return customerAdvanceService.getByCustomer(customerId);
  });

  console.log('✅ CustomerAdvance IPC handlers registered');
}