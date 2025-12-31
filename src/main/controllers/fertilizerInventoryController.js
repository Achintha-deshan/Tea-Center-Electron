import { ipcMain } from 'electron';
import fertilizerService from '../services/fertilizerInventoryService.js';

export function registerFertilizerInventoryHandlers() {

  ipcMain.handle('fertilizer:getAll', () =>
    fertilizerService.getAll()
  );

  ipcMain.handle('fertilizer:getNextId', () =>
    fertilizerService.getNextId()
  );

  ipcMain.handle('fertilizer:add', (e, data) =>
    fertilizerService.add(data)
  );

  ipcMain.handle('fertilizer:update', (e, data) =>
    fertilizerService.update(data)
  );

  ipcMain.handle('fertilizer:delete', (e, id) =>
    fertilizerService.delete(id)
  );

  console.log('✅ FertilizerInventory IPC registered');
}
