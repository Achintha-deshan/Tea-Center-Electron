import db from '../database/connection.js';
import FertilizerOrder from '../models/fertilizerOrderModel.js';

class FertilizerOrderService {

    // ================= GET ALL =================
    getAll() {
        try {
            console.log('🧪 Getting all fertilizer orders...');
            const rows = db.prepare(`
                SELECT f.*, c.Name AS CustomerName
                FROM FertilizerOrder f
                LEFT JOIN Customer c ON f.CustomerID = c.CustomerID
                ORDER BY f.Date DESC, f.OrderID DESC
            `).all();

            console.log(`✅ Found ${rows.length} orders`);
            return rows;
        } catch (err) {
            console.error('❌ getAll error:', err);
            return [];
        }
    }

    // ================= NEXT ID =================
    getNextId() {
        try {
            const row = db.prepare(
                'SELECT OrderID FROM FertilizerOrder ORDER BY OrderID DESC LIMIT 1'
            ).get();

            if (!row) return 'FO001';

            const num = parseInt(row.OrderID.substring(2)) + 1;
            return 'FO' + String(num).padStart(3, '0');
        } catch (err) {
            console.error('❌ getNextId error:', err);
            return 'FO001';
        }
    }

    // ================= ADD =================
    add(data) {
        try {
            const order = new FertilizerOrder(data);
            const { valid, errors } = order.validate();

            if (!valid) {
                return { success: false, message: errors.join(', ') };
            }

            // ===== CHECK INVENTORY =====
            const inventory = db.prepare(
                'SELECT Quantity FROM FertilizerInventory WHERE FInventoryId = ?'
            ).get(order.FInventoryID);

            if (!inventory) {
                return { success: false, message: 'Inventory not found' };
            }

            if (order.Quantity > inventory.Quantity) {
                return { success: false, message: 'Order quantity exceeds available stock!' };
            }

            const nextId = this.getNextId();

            const stmt = db.prepare(`
                INSERT INTO FertilizerOrder
                (OrderID, CustomerID, FInventoryID, FertilizerType, Quantity, Price,
                 TransporterID, TransportFee, Date, HalfPayment1, HalfPayment2)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                nextId,
                order.CustomerID,
                order.FInventoryID,
                order.FertilizerType,
                order.Quantity,
                order.Price,
                order.TransporterID || null,
                order.TransportFee,
                order.Date,
                order.HalfPayment1,
                order.HalfPayment2
            );

            // ===== UPDATE INVENTORY =====
            db.prepare('UPDATE FertilizerInventory SET Quantity = Quantity - ? WHERE FInventoryId = ?')
                .run(order.Quantity, order.FInventoryID);

            console.log('✅ Fertilizer order added:', nextId);
            return { success: true, id: nextId };

        } catch (err) {
            console.error('❌ add error:', err);
            return { success: false, message: err.message };
        }
    }

    // ================= UPDATE =================
    update(data) {
        try {
            // ===== GET EXISTING ORDER =====
            const oldOrder = db.prepare(`SELECT * FROM FertilizerOrder WHERE OrderID = ?`).get(data.OrderID);
            if (!oldOrder) return { success: false, message: 'Order not found' };

            // ===== CALCULATE INVENTORY ADJUSTMENT =====
            if (oldOrder.FInventoryID === data.FInventoryID) {
                // Same inventory: adjust quantity difference
                const qtyDiff = data.Quantity - oldOrder.Quantity; // positive: increase order, negative: decrease
                const inventory = db.prepare('SELECT Quantity FROM FertilizerInventory WHERE FInventoryId = ?').get(data.FInventoryID);
                if (qtyDiff > inventory.Quantity) {
                    return { success: false, message: 'Not enough stock for updated quantity!' };
                }
                db.prepare('UPDATE FertilizerInventory SET Quantity = Quantity - ? WHERE FInventoryId = ?')
                    .run(qtyDiff, data.FInventoryID);
            } else {
                // Different inventory: restore old inventory and reduce new inventory
                db.prepare('UPDATE FertilizerInventory SET Quantity = Quantity + ? WHERE FInventoryId = ?')
                    .run(oldOrder.Quantity, oldOrder.FInventoryID);

                const newInventory = db.prepare('SELECT Quantity FROM FertilizerInventory WHERE FInventoryId = ?').get(data.FInventoryID);
                if (data.Quantity > newInventory.Quantity) {
                    return { success: false, message: 'Not enough stock in new inventory!' };
                }
                db.prepare('UPDATE FertilizerInventory SET Quantity = Quantity - ? WHERE FInventoryId = ?')
                    .run(data.Quantity, data.FInventoryID);
            }

            // ===== UPDATE ORDER =====
            const stmt = db.prepare(`
            UPDATE FertilizerOrder
            SET CustomerID = ?, FInventoryID = ?, FertilizerType = ?, Quantity = ?, Price = ?,
                TransporterID = ?, TransportFee = ?, Date = ?, HalfPayment1 = ?, HalfPayment2 = ?
            WHERE OrderID = ?
        `);

            stmt.run(
                data.CustomerID,
                data.FInventoryID,
                data.FertilizerType,
                data.Quantity,
                data.Price,
                data.TransporterID || null,
                data.TransportFee,
                data.Date,
                data.HalfPayment1,
                data.HalfPayment2,
                data.OrderID
            );

            return { success: true };
        } catch (err) {
            console.error('❌ update error:', err);
            return { success: false, message: err.message };
        }
    }

    // ================= DELETE =================
    delete(id) {
        try {
            const order = db.prepare('SELECT * FROM FertilizerOrder WHERE OrderID = ?').get(id);
            if (!order) return { success: false, message: 'Order not found' };

            // ===== RESTORE INVENTORY =====
            db.prepare('UPDATE FertilizerInventory SET Quantity = Quantity + ? WHERE FInventoryId = ?')
                .run(order.Quantity, order.FInventoryID);

            const result = db.prepare('DELETE FROM FertilizerOrder WHERE OrderID = ?').run(id);

            if (result.changes === 0) {
                return { success: false, message: 'Order not found' };
            }

            return { success: true };
        } catch (err) {
            console.error('❌ delete error:', err);
            return { success: false, message: err.message };
        }
    }

    // ================= SEARCH CUSTOMER =================
    searchCustomer(query) {
        try {
            const search = `%${query}%`;
            return db.prepare(`
                SELECT CustomerID, Name, Phone
                FROM Customer
                WHERE CustomerID LIKE ? OR Name LIKE ?
                ORDER BY Name LIMIT 10
            `).all(search, search);
        } catch (err) {
            console.error('❌ searchCustomer error:', err);
            return [];
        }
    }

    // ================= TRANSPORT EMPLOYEES =================
    getTransportEmployees() {
        try {
            return db.prepare(`
                SELECT EmployeeID, Name
                FROM Employee
                WHERE Position LIKE '%Transport%'
            `).all();
        } catch (err) {
            console.error('❌ getTransportEmployees error:', err);
            return [];
        }
    }

    // ================= INVENTORY BY TYPE =================
    getInventoryByType(type) {
        try {
            return db.prepare(`
                SELECT FInventoryId, Fertilizer, Quantity, BuyPrice, SellPrice
                FROM FertilizerInventory
                WHERE Fertilizer = ?
            `).all(type);
        } catch (err) {
            console.error('❌ getInventoryByType error:', err);
            return [];
        }
    }

    // ================= INVENTORY DETAILS =================
    getInventoryDetails(id) {
        try {
            return db.prepare(`
                SELECT *
                FROM FertilizerInventory
                WHERE FInventoryId = ?
            `).get(id);
        } catch (err) {
            console.error('❌ getInventoryDetails error:', err);
            return null;
        }
    }
}

export default new FertilizerOrderService();
