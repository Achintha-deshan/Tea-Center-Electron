import { ipcMain } from 'electron';
import teaPacketInventoryService from '../services/teaPacketInventoryService.js';

export function registerTeaPacketInventoryHandlers() {
  ipcMain.handle('teaPacketInventory:getAll', () => teaPacketInventoryService.getAll());
  ipcMain.handle('teaPacketInventory:getNextId', () => teaPacketInventoryService.getNextId());
  ipcMain.handle('teaPacketInventory:add', (e, data) => teaPacketInventoryService.add(data));
  ipcMain.handle('teaPacketInventory:update', (e, data) => teaPacketInventoryService.update(data));
  ipcMain.handle('teaPacketInventory:delete', (e, id) => teaPacketInventoryService.delete(id));
  ipcMain.handle('teaPacketInventory:updateQuantity', async (event, inventoryId, quantityChange) => {
    try {
      const stmt = db.prepare(`
                UPDATE TeaInventory 
                SET TeaPacketQTY = TeaPacketQTY + ? 
                WHERE TPinventoryId = ?
            `);
      const result = stmt.run(quantityChange, inventoryId);

      if (result.changes === 0) {
        return { success: false, message: 'Inventory item not found' };
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating inventory quantity:', err);
      return { success: false, message: err.message };
    }
  });

  console.log('✅ TeaPacketInventory IPC registered');
}
