// src/main/services/teaFactoryService.js
import db from '../database/connection.js';
import TeaFactory from '../models/teaFactoryModel.js'; // correct name!

class TeaFactoryService {
  getAll() {
    const rows = db.prepare('SELECT FactoryID, FactoryName, Address, Phone FROM TeaFactory ORDER BY FactoryID').all();
    return rows.map(row => TeaFactory.fromDB(row).toJSON());
  }

  generateNextId() {
    const row = db.prepare('SELECT FactoryID FROM TeaFactory ORDER BY FactoryID DESC LIMIT 1').get();
    if (!row) return 'TF001';
    const num = parseInt(row.FactoryID.substring(2)) + 1;
    return 'TF' + String(num).padStart(3, '0');
  }

  add(data) {
    try {
      const id = this.generateNextId();
      const factory = new TeaFactory({
        teaFactoryId: id,
        name: data.name,
        address: data.address,
        phone: data.phone
      });

      const validation = factory.validate();
      if (!validation.valid) return { success: false, message: validation.errors.join(', ') };

      const dbData = factory.toDB();
      db.prepare('INSERT INTO TeaFactory (FactoryID, FactoryName, Address, Phone) VALUES (?, ?, ?, ?)')
        .run(dbData.FactoryID, dbData.FactoryName, dbData.Address, dbData.Phone);

      return { success: true, id };
    } catch (err) {
      return { success: false, message: 'Add failed' };
    }
  }

  update(data) {
    try {
      const factory = new TeaFactory({
        teaFactoryId: data.teaFactoryId,
        name: data.name,
        address: data.address,
        phone: data.phone
      });

      const validation = factory.validate();
      if (!validation.valid) return { success: false, message: validation.errors.join(', ') };

      const dbData = factory.toDB();
      db.prepare('UPDATE TeaFactory SET FactoryName = ?, Address = ?, Phone = ? WHERE FactoryID = ?')
        .run(dbData.FactoryName, dbData.Address, dbData.Phone, dbData.FactoryID);

      return { success: true };
    } catch (err) {
      return { success: false, message: 'Update failed' };
    }
  }

  delete(id) {
    try {
      db.prepare('DELETE FROM TeaFactory WHERE FactoryID = ?').run(id);
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Delete failed' };
    }
  }
}

export default new TeaFactoryService();