import db from '../database/connection.js';
import CustomerRawTeaPayment from '../models/MonthlyTeaRatemodel.js';

class MonthlyTeaRateService {

  getNextId() {
    try {
      const row = db
        .prepare('SELECT PaymentID FROM CustomerRawTeaPayment ORDER BY PaymentID DESC LIMIT 1')
        .get();

      if (!row) return 'MTR001';

      const num = parseInt(row.PaymentID.replace('MTR', '')) + 1;
      return 'MTR' + String(num).padStart(3, '0');

    } catch (err) {
      console.error('❌ getNextId error:', err);
      return 'MTR001';
    }
  }

  add(data) {
    try {
      // ✅ Model dependency
      const payment = new CustomerRawTeaPayment(data);

      // ❌ calculation here NOT needed (renderer already did it)

      // ✅ Validation only
      const validation = payment.validate();
      if (!validation.valid) {
        return { success: false, message: validation.errors.join(', ') };
      }

      const paymentId = this.getNextId();

      const sql = `
        INSERT INTO CustomerRawTeaPayment (
          PaymentID,
          CustomerID,
          Year,
          Month,
          Date,
          BestTeaKg,
          NormalTeaKg,
          BestTeaRate,
          NormalTeaRate,
          BestTeaPrice,
          NormalTeaPrice,
          FullTotal
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `;

      db.prepare(sql).run(
        paymentId,
        payment.CustomerID,
        payment.Year,
        payment.Month,
        payment.Date,
        payment.BestTeaKg,
        payment.NormalTeaKg,
        payment.BestTeaRate,
        payment.NormalTeaRate,
        payment.BestTeaPrice,
        payment.NormalTeaPrice,
        payment.FullTotal
      );

      return { success: true, id: paymentId };

    } catch (err) {
      console.error('❌ add error:', err);
      return { success: false, message: err.message };
    }
  }

  // 🔹 MAIN METHOD (Renderer uses ONLY this)
  loadByYearMonth(year, month) {

    // 1️⃣ Check calculated payments exist?
    const paymentRows = db.prepare(`
      SELECT * FROM CustomerRawTeaPayment
      WHERE Year = ? AND Month = ?
    `).all(year, month);

    if (paymentRows.length > 0) {
      return {
        source: 'PAYMENT',
        data: paymentRows
      };
    }

    // 2️⃣ Else → load RAW tea inventory summary
    const monthStr = String(month).padStart(2, '0');

    const rawRows = db.prepare(`
      SELECT
        CustomerID,
        SUM(CASE WHEN TeaType='Best Tea' THEN NetValue ELSE 0 END) AS BestTeaKg,
        SUM(CASE WHEN TeaType='Normal Tea' THEN NetValue ELSE 0 END) AS NormalTeaKg
      FROM RAWTeaInventory
      WHERE strftime('%Y', Date) = ?
        AND strftime('%m', Date) = ?
      GROUP BY CustomerID
    `).all(String(year), monthStr);

    return {
      source: 'RAW',
      data: rawRows
    };
  }

  update(data) {
    try {

      const sql = `
      UPDATE CustomerRawTeaPayment
      SET 
        BestTeaRate = ?, NormalTeaRate = ?,
        BestTeaPrice = ?, NormalTeaPrice = ?, FullTotal = ?, Date = ?
      WHERE PaymentID = ?
    `;

      db.prepare(sql).run(
        data.BestTeaRate,
        data.NormalTeaRate,
        data.BestTeaPrice,
        data.NormalTeaPrice,
        data.FullTotal,
        data.Date,
        data.PaymentID
      );

      return { success: true };
    } catch (err) {
      console.error('❌ update error:', err);
      return { success: false, message: err.message };
    }
  }

}

export default new MonthlyTeaRateService();
