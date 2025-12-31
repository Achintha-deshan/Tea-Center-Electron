import db from '../database/connection.js';
import TeaPacketOrder from '../models/teaPacketOrderModel.js';

class TeaPacketOrderService {

  getAll() {
    const rows = db.prepare('SELECT o.*, c.Name AS CustomerName FROM TeaPacketOrder o JOIN Customer c ON o.CustomerID=c.CustomerID ORDER BY OrderID').all();
    return rows.map(row => TeaPacketOrder.fromDB(row).toJSON());
  }

  getNextId() {
    const row = db.prepare('SELECT OrderID FROM TeaPacketOrder ORDER BY OrderID DESC LIMIT 1').get();
    if (!row) return 'TPO001';
    const num = parseInt(row.OrderID.substring(3)) + 1;
    return 'TPO' + String(num).padStart(3, '0');
  }

  add(data) {
    const order = new TeaPacketOrder(data);
    const validation = order.validate();
    if (!validation.valid) return { success: false, message: validation.errors.join(', ') };

    order.OrderID = this.getNextId();

    const insertOrder = db.prepare(`
      INSERT INTO TeaPacketOrder
      (OrderID, CustomerID, TPinventoryId, Quantity, Price, FullTotal, OrderDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateInventory = db.prepare(`
      UPDATE TeaInventory
      SET TeaPacketQTY = TeaPacketQTY - ?
      WHERE TPinventoryId = ?
    `);

    const transaction = db.transaction(() => {
      insertOrder.run(order.OrderID, order.CustomerID, order.TPinventoryId, order.Quantity, order.Price, order.FullTotal, order.OrderDate);
      updateInventory.run(order.Quantity, order.TPinventoryId);
    });

    try {
      transaction();
      return { success: true, id: order.OrderID };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  update(data) {
    const order = new TeaPacketOrder(data);

    const oldOrder = db.prepare('SELECT * FROM TeaPacketOrder WHERE OrderID = ?').get(order.OrderID);
    if (!oldOrder) return { success: false, message: 'Order not found' };

    const qtyDiff = order.Quantity - oldOrder.Quantity;

    const updateOrder = db.prepare(`
      UPDATE TeaPacketOrder
      SET CustomerID=?, TPinventoryId=?, Quantity=?, Price=?, FullTotal=?, OrderDate=?
      WHERE OrderID=?
    `);

    const updateInventory = db.prepare(`
      UPDATE TeaInventory
      SET TeaPacketQTY = TeaPacketQTY - ?
      WHERE TPinventoryId = ?
    `);

    const transaction = db.transaction(() => {
      updateOrder.run(order.CustomerID, order.TPinventoryId, order.Quantity, order.Price, order.FullTotal, order.OrderDate, order.OrderID);
      updateInventory.run(qtyDiff, order.TPinventoryId);
    });

    try {
      transaction();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  delete(orderId) {
    const order = db.prepare('SELECT * FROM TeaPacketOrder WHERE OrderID = ?').get(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const deleteOrder = db.prepare('DELETE FROM TeaPacketOrder WHERE OrderID = ?');
    const restoreInventory = db.prepare('UPDATE TeaInventory SET TeaPacketQTY = TeaPacketQTY + ? WHERE TPinventoryId = ?');

    const transaction = db.transaction(() => {
      deleteOrder.run(orderId);
      restoreInventory.run(order.Quantity, order.TPinventoryId);
    });

    try {
      transaction();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export default new TeaPacketOrderService();
