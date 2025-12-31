// src/main/services/fertilizerInventoryService.js
import db from '../database/connection.js';
import FertilizerInventory from '../models/fertilizerInventoryModel.js';

class FertilizerInventoryService {
  getAll() {
    try {
      const rows = db.prepare('SELECT * FROM FertilizerInventory ORDER BY FInventoryId').all();
      return rows.map(row => FertilizerInventory.fromDB(row).toJSON());
    } catch (error) {
      console.error('getAll error:', error);
      return [];
    }
  }

  getNextId() {
    try {
      console.log('Service: Getting next ID...');
      const row = db.prepare('SELECT FInventoryId FROM FertilizerInventory ORDER BY FInventoryId DESC LIMIT 1').get();
      console.log('Service: Last row:', row);
      
      if (!row) {
        console.log('Service: No records, returning FINV001');
        return { success: true, id: 'FINV001' };
      }
      
      const lastId = row.FInventoryId;
      console.log('Service: Last ID:', lastId);
      
      const num = parseInt(lastId.substring(4)) + 1;
      const nextId = 'FINV' + String(num).padStart(3, '0');
      console.log('Service: Next ID:', nextId);
      
      return { success: true, id: nextId };
    } catch (error) {
      console.error('getNextId error:', error);
      return { success: false, id: 'FINV001' };
    }
  }

  add(data) {
    try {
      console.log('Service: Adding inventory:', data);
      
      // Get next ID
      const nextIdResult = this.getNextId();
      const nextId = nextIdResult.id;
      console.log('Service: Using ID:', nextId);

      const inventory = new FertilizerInventory({
        ...data,
        FInventoryId: nextId
      });

      const validation = inventory.validate();
      if (!validation.valid) {
        console.error('Validation failed:', validation.errors);
        return { success: false, message: validation.errors.join(', ') };
      }

      const stmt = db.prepare(`
        INSERT INTO FertilizerInventory 
        (FInventoryId, Fertilizer, Quantity, BuyPrice, SellPrice, Date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        nextId,
        inventory.Fertilizer,
        inventory.Quantity,
        inventory.BuyPrice,
        inventory.SellPrice,
        inventory.Date
      );

      console.log('Service: Successfully added with ID:', nextId);
      return { success: true, id: nextId };
    } catch (error) {
      console.error('Add error:', error);
      return { success: false, message: 'Failed to add: ' + error.message };
    }
  }

  update(data) {
    try {
      console.log('Service: Updating inventory:', data);
      
      const inventory = new FertilizerInventory(data);
      const validation = inventory.validate();
      
      if (!validation.valid) {
        return { success: false, message: validation.errors.join(', ') };
      }

      const stmt = db.prepare(`
        UPDATE FertilizerInventory 
        SET Fertilizer = ?, Quantity = ?, BuyPrice = ?, SellPrice = ?, Date = ?
        WHERE FInventoryId = ?
      `);

      const result = stmt.run(
        inventory.Fertilizer,
        inventory.Quantity,
        inventory.BuyPrice,
        inventory.SellPrice,
        inventory.Date,
        inventory.FInventoryId
      );

      if (result.changes === 0) {
        return { success: false, message: 'No record found to update' };
      }

      console.log('Service: Successfully updated');
      return { success: true };
    } catch (error) {
      console.error('Update error:', error);
      return { success: false, message: 'Failed to update: ' + error.message };
    }
  }

  delete(id) {
    try {
      console.log('Service: Deleting inventory:', id);
      
      const stmt = db.prepare('DELETE FROM FertilizerInventory WHERE FInventoryId = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        return { success: false, message: 'No record found to delete' };
      }

      console.log('Service: Successfully deleted');
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      if (error.message.includes('FOREIGN KEY')) {
        return { success: false, message: 'Cannot delete: Used in fertilizer orders' };
      }
      return { success: false, message: 'Failed to delete: ' + error.message };
    }
  }
}

export default new FertilizerInventoryService();