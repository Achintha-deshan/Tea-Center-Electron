// src/services/teaPacketInventoryService.js

import db from '../database/connection.js';
import TeaPacketInventory from '../models/teaPacketInventoryModel.js';

class TeaPacketInventoryService {
  // ==================== Get All Inventory ====================
  getAll() {
    const rows = db.prepare('SELECT * FROM TeaInventory ORDER BY TPinventoryId').all();
    return rows.map(row => TeaPacketInventory.fromDB(row).toJSON());
  }

  // ==================== Get Next ID ====================
  getNextId() {
    const row = db.prepare('SELECT TPinventoryId FROM TeaInventory ORDER BY TPinventoryId DESC LIMIT 1').get();
    if (!row) return 'TPI001';
    const num = parseInt(row.TPinventoryId.substring(3)) + 1;
    return 'TPI' + String(num).padStart(3, '0');
  }

  // ==================== Add New Inventory Item ====================
  add(data) {
    const inventory = new TeaPacketInventory(data);
    const validation = inventory.validate();
    if (!validation.valid) return { success: false, message: validation.errors.join(', ') };

    const nextId = this.getNextId();
    inventory.TPinventoryId = nextId;

    const stmt = db.prepare(`
      INSERT INTO TeaInventory 
      (TPinventoryId, TeaType, BuyPrice, SellPrice, TeaPacket, TeaPacketQTY, Date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        inventory.TPinventoryId,
        inventory.TeaType,
        inventory.BuyPrice,
        inventory.SellPrice,
        inventory.TeaPacket,
        inventory.TeaPacketQTY,
        inventory.Date
      );
      return { success: true, id: nextId };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ==================== Update Existing Inventory Item ====================
  update(data) {
    const inventory = new TeaPacketInventory(data);

    const stmt = db.prepare(`
      UPDATE TeaInventory
      SET TeaType=?, BuyPrice=?, SellPrice=?, TeaPacket=?, TeaPacketQTY=?, Date=?
      WHERE TPinventoryId=?
    `);

    try {
      const result = stmt.run(
        inventory.TeaType,
        inventory.BuyPrice,
        inventory.SellPrice,
        inventory.TeaPacket,
        inventory.TeaPacketQTY,
        inventory.Date,
        inventory.TPinventoryId
      );

      if (result.changes === 0) {
        return { success: false, message: 'Inventory item not found' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ==================== Delete Inventory Item ====================
  delete(id) {
    const stmt = db.prepare('DELETE FROM TeaInventory WHERE TPinventoryId = ?');
    try {
      const result = stmt.run(id);
      if (result.changes === 0) {
        return { success: false, message: 'Inventory item not found' };
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ==================== NEW: Update Quantity Only (Used when selling packets) ====================
  // quantityChange can be negative (when selling) or positive (when returning/restocking)
  updateQuantity(inventoryId, quantityChange) {
    if (!inventoryId || typeof quantityChange !== 'number') {
      return { success: false, message: 'Invalid parameters' };
    }

    const stmt = db.prepare(`
      UPDATE TeaInventory 
      SET TeaPacketQTY = TeaPacketQTY + ?
      WHERE TPinventoryId = ?
    `);

    try {
      const result = stmt.run(quantityChange, inventoryId);

      if (result.changes === 0) {
        return { success: false, message: 'Inventory item not found or no change applied' };
      }

      // Optional: Check if quantity goes negative (you can allow or block)
      const current = db.prepare('SELECT TeaPacketQTY FROM TeaInventory WHERE TPinventoryId = ?')
        .get(inventoryId);

      if (current && current.TeaPacketQTY < 0) {
        // If you don't want negative stock, rollback (optional)
        // stmt.run(-quantityChange, inventoryId); // rollback
        // return { success: false, message: 'Insufficient stock' };
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating quantity:', err);
      return { success: false, message: err.message };
    }
  }
}

export default new TeaPacketInventoryService();