// src/main/controllers/otherAddController.js

import { ipcMain } from 'electron';
import otherAddService from '../services/otherAddService.js';

export function registerOtherAddHandlers() {

  // ================= Get All =================
  ipcMain.handle('otherAdd:getAll', async () => {
    return otherAddService.getAll();
  });

  // ================= Get Next ID =================
  ipcMain.handle('otherAdd:getNextId', async () => {
    return otherAddService.generateNextId();
  });

  // ================= Add =================
  ipcMain.handle('otherAdd:add', async (e, data) => {
    try {
      return otherAddService.add(data);
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // ================= Update =================
  ipcMain.handle('otherAdd:update', async (e, data) => {
    try {
      return otherAddService.update(data);
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // ================= Delete =================
  ipcMain.handle('otherAdd:delete', async (e, otherId) => {
    try {
      return otherAddService.delete(otherId);
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // ================= Get By Customer =================
  ipcMain.handle('otherAdd:getByCustomer', async (e, customerId) => {
    return otherAddService.getByCustomer(customerId);
  });

  console.log('✅ OtherAdd IPC handlers registered');
}
