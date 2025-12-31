// src/main/services/customerService.js
import db from '../database/connection.js';
import Customer from '../models/customerModal.js'; // correct name!

class CustomerService {
  getAll() {
    const rows = db.prepare('SELECT * FROM Customer ORDER BY CustomerID').all();
    return rows.map(row => Customer.fromDB(row).toJSON());
  }

  getNextId() {
    const row = db.prepare('SELECT CustomerID FROM Customer ORDER BY CustomerID DESC LIMIT 1').get();
    if (!row) return 'C001';
    const num = parseInt(row.CustomerID.substring(1)) + 1;
    return 'C' + String(num).padStart(3, '0');
  }

  add(data) {
    try {
      const customerId = this.getNextId();
      data.CustomerID = customerId;

      const customer = new Customer(data);
      const validation = customer.validate();
      if (!validation.valid) return { success: false, message: validation.errors.join(', ') };

      const existing = db.prepare('SELECT 1 FROM Customer WHERE Name = ?').get(customer.Name);
      if (existing) return { success: false, message: 'Customer name already exists' };

      db.prepare(`
        INSERT INTO Customer (CustomerID, Name, Address, Phone, TransportRequired)
        VALUES (?, ?, ?, ?, ?)
      `).run(customerId, customer.Name, customer.Address, customer.Phone, customer.TransportRequired);

      return { success: true, id: customerId };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Failed to add customer' };
    }
  }

  update(data) {
    try {
      const customer = new Customer(data);
      const validation = customer.validate();
      if (!validation.valid) return { success: false, message: validation.errors.join(', ') };

      const duplicate = db.prepare('SELECT 1 FROM Customer WHERE Name = ? AND CustomerID != ?')
        .get(customer.Name, customer.CustomerID);
      if (duplicate) return { success: false, message: 'Another customer with this name exists' };

      db.prepare(`
        UPDATE Customer SET Name = ?, Address = ?, Phone = ?, TransportRequired = ?
        WHERE CustomerID = ?
      `).run(customer.Name, customer.Address, customer.Phone, customer.TransportRequired, customer.CustomerID);

      return { success: true };
    } catch (error) {
      return { success: false, message: 'Failed to update' };
    }
  }

  delete(id) {
    try {
      db.prepare('DELETE FROM Customer WHERE CustomerID = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Failed to delete' };
    }
  }

  searchCustomer(query) {
    if (!query || query.trim() === '') return [];

    try {
      const search = `%${query}%`;

      return db.prepare(`
      SELECT CustomerID, Name, Phone, TransportRequired
      FROM Customer
      WHERE LOWER(CustomerID) LIKE LOWER(?)
         OR LOWER(Name) LIKE LOWER(?)
      ORDER BY Name
      LIMIT 10
    `).all(search, search);

    } catch (err) {
      console.error('❌ searchCustomer error:', err);
      return [];
    }
  }

}

export default new CustomerService(); 