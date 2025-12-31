// src/main/services/otherAddService.js
import db from '../database/connection.js';
import OtherAdd from '../models/otherpriceModel.js';

class OtherAddService {

  // ================= Get All =================
  getAll() {
    const rows = db.prepare(`
      SELECT oa.OtherID, oa.CustomerID, c.Name AS CustomerName,
             oa.Description, oa.Price, oa.Date
      FROM OtherAdd oa
      JOIN Customer c ON oa.CustomerID = c.CustomerID
      ORDER BY oa.Date DESC
    `).all();

    return rows.map(r => ({
      OtherID: r.OtherID,
      CustomerID: r.CustomerID,
      CustomerName: r.CustomerName,
      Description: r.Description,
      Price: r.Price,
      Date: r.Date
    }));
  }

  // ================= Generate Next ID =================
  generateNextId() {
    const row = db.prepare(`
      SELECT OtherID
      FROM OtherAdd
      ORDER BY OtherID DESC
      LIMIT 1
    `).get();

    if (!row) return 'OTH001';
    const num = parseInt(row.OtherID.replace('OTH', '')) + 1;
    return `OTH${String(num).padStart(3, '0')}`;
  }

  // ================= Add =================
  add(data) {
    try {
      const id = this.generateNextId();
      const otherAdd = new OtherAdd({
        OtherID: id,
        CustomerID: data.CustomerID,
        Description: data.Description,
        Price: data.Price,
        Date: data.Date
      });

      const { valid, errors } = otherAdd.validate();
      if (!valid) return { success: false, message: errors.join(', ') };

      const dbData = otherAdd.toDB();
      db.prepare(`
        INSERT INTO OtherAdd (OtherID, CustomerID, Description, Price, Date)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        dbData.OtherID,
        dbData.CustomerID,
        dbData.Description,
        dbData.Price,
        dbData.Date
      );

      return { success: true, id };
    } catch (err) {
      return { success: false, message: 'Add failed' };
    }
  }

  // ================= Update =================
  update(data) {
    try {
      const otherAdd = new OtherAdd({
        OtherID: data.OtherID,
        CustomerID: data.CustomerID,
        Description: data.Description,
        Price: data.Price,
        Date: data.Date
      });

      const { valid, errors } = otherAdd.validate();
      if (!valid) return { success: false, message: errors.join(', ') };

      const dbData = otherAdd.toDB();
      db.prepare(`
        UPDATE OtherAdd
        SET CustomerID = ?, Description = ?, Price = ?, Date = ?
        WHERE OtherID = ?
      `).run(
        dbData.CustomerID,
        dbData.Description,
        dbData.Price,
        dbData.Date,
        dbData.OtherID
      );

      return { success: true };
    } catch (err) {
      return { success: false, message: 'Update failed' };
    }
  }

  // ================= Delete =================
  delete(id) {
    try {
      db.prepare(`DELETE FROM OtherAdd WHERE OtherID = ?`).run(id);
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Delete failed' };
    }
  }

  // ================= Get By Customer =================
  getByCustomer(customerId) {
    const rows = db.prepare(`
      SELECT OtherID, Description, Price, Date
      FROM OtherAdd
      WHERE CustomerID = ?
      ORDER BY Date DESC
    `).all(customerId);

    return rows;
  }
}

export default new OtherAddService();
