// src/main/services/customerAdvanceService.js
import db from '../database/connection.js';
import CustomerAdvance from '../models/advanceModel.js';

class CustomerAdvanceService {

  // ================= Get All =================
  getAll() {
    const rows = db.prepare(`
      SELECT ca.AdvanceID, ca.CustomerID, c.Name AS CustomerName,
             ca.AdvanceAmount, ca.Date
      FROM CustomerAdvance ca
      JOIN Customer c ON ca.CustomerID = c.CustomerID
      ORDER BY ca.Date DESC
    `).all();

    return rows.map(r => ({
      AdvanceID: r.AdvanceID,
      CustomerID: r.CustomerID,
      CustomerName: r.CustomerName,
      AdvanceAmount: r.AdvanceAmount,
      Date: r.Date
    }));
  }

  // ================= Generate Next ID =================
  generateNextId() {
    const row = db.prepare(`
      SELECT AdvanceID
      FROM CustomerAdvance
      ORDER BY AdvanceID DESC
      LIMIT 1
    `).get();

    if (!row) return 'ADV001';
    const num = parseInt(row.AdvanceID.replace('ADV', '')) + 1;
    return `ADV${String(num).padStart(3, '0')}`;
  }

  // ================= Add =================
  add(data) {
    try {
      const id = this.generateNextId();
      const advance = new CustomerAdvance({
        AdvanceID: id,
        CustomerID: data.CustomerID,
        AdvanceAmount: data.AdvanceAmount,
        Date: data.Date
      });

      const { valid, errors } = advance.validate();
      if (!valid) return { success: false, message: errors.join(', ') };

      const dbData = advance.toDB();
      db.prepare(`
        INSERT INTO CustomerAdvance (AdvanceID, CustomerID, AdvanceAmount, Date)
        VALUES (?, ?, ?, ?)
      `).run(dbData.AdvanceID, dbData.CustomerID, dbData.AdvanceAmount, dbData.Date);

      return { success: true, id };
    } catch (err) {
      return { success: false, message: 'Add failed' };
    }
  }

  // ================= Update =================
  update(data) {
    try {
      const advance = new CustomerAdvance({
        AdvanceID: data.AdvanceID,
        CustomerID: data.CustomerID,
        AdvanceAmount: data.AdvanceAmount,
        Date: data.Date
      });

      const { valid, errors } = advance.validate();
      if (!valid) return { success: false, message: errors.join(', ') };

      const dbData = advance.toDB();
      db.prepare(`
        UPDATE CustomerAdvance
        SET CustomerID = ?, AdvanceAmount = ?, Date = ?
        WHERE AdvanceID = ?
      `).run(dbData.CustomerID, dbData.AdvanceAmount, dbData.Date, dbData.AdvanceID);

      return { success: true };
    } catch (err) {
      return { success: false, message: 'Update failed' };
    }
  }

  // ================= Delete =================
  delete(id) {
    try {
      db.prepare(`DELETE FROM CustomerAdvance WHERE AdvanceID = ?`).run(id);
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Delete failed' };
    }
  }

  // ================= Get By Customer =================
  getByCustomer(customerId) {
    const rows = db.prepare(`
      SELECT AdvanceID, AdvanceAmount, Date
      FROM CustomerAdvance
      WHERE CustomerID = ?
      ORDER BY Date DESC
    `).all(customerId);

    return rows;
  }
}

export default new CustomerAdvanceService();
