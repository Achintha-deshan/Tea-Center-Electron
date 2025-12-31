// src/main/services/rawTeaInventoryService.js

import db from '../database/connection.js';
import RawTeaInventory from '../models/rawTeaInventoryModel.js';

class RawTeaInventoryService {
  getAll() {
    try {
      console.log('📦 Getting all raw tea inventory...');
      const rows = db.prepare(`
        SELECT r.*, c.Name AS CustomerName, e.Name AS EmployeeName
        FROM RAWTeaInventory r
        LEFT JOIN Customer c ON r.CustomerID = c.CustomerID
        LEFT JOIN Employee e ON r.EmployeeID = e.EmployeeID
        ORDER BY r.Date DESC, r.RAWTEAInventoryID DESC
      `).all();

      console.log(`✅ Found ${rows.length} records`);
      return rows.map(row => RawTeaInventory.fromDB(row, row.CustomerName, row.EmployeeName).toJSON());
    } catch (err) {
      console.error('❌ getAll error:', err);
      return [];
    }
  }

  getNextId() {
    try {
      const row = db.prepare('SELECT RAWTEAInventoryID FROM RAWTeaInventory ORDER BY RAWTEAInventoryID DESC LIMIT 1').get();
      if (!row) return 'RI001';
      const num = parseInt(row.RAWTEAInventoryID.substring(2)) + 1;
      return 'RI' + String(num).padStart(3, '0');
    } catch (err) {
      console.error('❌ getNextId error:', err);
      return 'RI001';
    }
  }

  add(data) {
    try {
      const nextId = this.getNextId();

      const stmt = db.prepare(`
        INSERT INTO RAWTeaInventory
        (RAWTEAInventoryID, CustomerID, EmployeeID, QuantityKg, GrossValue, NetValue, TeaType, TransportFee, FactoryTransportFee, Date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        nextId,
        data.CustomerID,
        data.EmployeeID || null,
        data.QuantityKg,
        data.GrossValue ,
        data.NetValue ,
        data.TeaType,
        data.TransportFee || 0,
        data.FactoryTransportFee || 0,
        data.Date
      );

      return { success: true, id: nextId };
    } catch (err) {
      console.error('add error:', err);
      return { success: false, message: err.message };
    }
  }

  // rawTeaInventoryService.js
update(data) {
    try {
        const stmt = db.prepare(`
            UPDATE RAWTeaInventory
            SET CustomerID = ?, EmployeeID = ?, QuantityKg = ?, GrossValue = ?, NetValue = ?, TransportFee = ?, FactoryTransportFee = ?, TeaType = ?, Date = ?
            WHERE RAWTEAInventoryID = ?
        `);
        stmt.run(data.CustomerID, data.EmployeeID, data.QuantityKg, data.GrossValue, data.NetValue, data.TransportFee, data.FactoryTransportFee, data.TeaType, data.Date, data.RAWTEAInventoryID);
        return { success: true };
    } catch (err) {
        console.error('Update error:', err);
        return { success: false, message: err.message };
    }
}


 delete(id) {
  try {
    if (!id) {
      throw new Error("No ID provided for deletion");
    }

    console.log('🗑️ Deleting raw tea inventory:', id);

    const stmt = db.prepare('DELETE FROM RAWTeaInventory WHERE RAWTEAInventoryID = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      console.warn('⚠️ No record deleted. ID may not exist.');
      return { success: false, message: 'No record found with this ID' };
    }

    console.log('✅ Deleted successfully');
    return { success: true };
  } catch (err) {
    console.error('❌ Delete error:', err);
    return { success: false, message: err.message || 'Delete failed' };
  }
}


  searchCustomer(query) {
    try {
      const search = `%${query}%`;
      return db.prepare(`
        SELECT CustomerID, Name, Phone, TransportRequired 
        FROM Customer 
        WHERE CustomerID LIKE ? OR Name LIKE ?
        ORDER BY Name LIMIT 10
      `).all(search, search);
    } catch (err) {
      console.error('❌ searchCustomer error:', err);
      return [];
    }
  }

  getTransportEmployees() {
    try {
      return db.prepare(`
        SELECT EmployeeID, Name 
        FROM Employee 
        WHERE Position LIKE '%Transport%' OR Position LIKE '%transporter%'
      `).all();
    } catch (err) {
      console.error('❌ getTransportEmployees error:', err);
      return [];
    }
  }

  // monthly rate ekt
  getMonthlyData(year, month) {
    try {
       console.log('📊 Fetching monthly data for:', year, month);
      const monthStr = String(month).padStart(2, '0'); //1 = 01
      
      return db.prepare(`
        SELECT 
          CustomerID,
          SUM(CASE WHEN TeaType = 'Best Tea' THEN NetValue ELSE 0 END) AS BestTeaKg,
          SUM(CASE WHEN TeaType = 'Normal Tea' THEN NetValue ELSE 0 END) AS NormalTeaKg
        FROM RAWTeaInventory
        WHERE strftime('%Y', Date) = ? 
          AND strftime('%m', Date) = ?
        GROUP BY CustomerID
      `).all(String(year), monthStr);
      
    } catch (err) {
      console.error('❌ getMonthlyData error:', err);
      return [];
    }
  }
}

export default new RawTeaInventoryService();