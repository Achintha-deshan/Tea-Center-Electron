// src/services/customerSummaryService.js
import db from '../database/connection.js';
import CustomerMonthlySummary from '../models/CustomerMonthlySummaryModel.js';

class CustomerSummaryService {

  // ================= Get Next Summary ID =================
  getNextId() {
    try {
      const row = db.prepare(`
        SELECT SummaryID 
        FROM CustomerMonthlySummary 
        WHERE SummaryID LIKE 'CMP%'
        ORDER BY CAST(SUBSTR(SummaryID, 4) AS INTEGER) DESC 
        LIMIT 1
      `).get();

      if (!row || !row.SummaryID) {
        console.log('📝 No existing summaries, starting with CMP0001');
        return 'CMP0001';
      }

      // Extract number part after "CMP"
      const numPart = row.SummaryID.substring(3);
      const num = parseInt(numPart, 10);

      if (isNaN(num)) {
        console.error('❌ Invalid SummaryID format:', row.SummaryID);
        return 'CMP0001';
      }

      const nextNum = num + 1;
      const nextId = 'CMP' + String(nextNum).padStart(4, '0');

      console.log(`✅ Generated new SummaryID: ${nextId} (previous: ${row.SummaryID})`);
      return nextId;

    } catch (err) {
      console.error('❌ getNextId error:', err);
      return 'CMP0001';
    }
  }

  // ================= Load Summary =================
  loadCustomerSummary(customerId, year, month) {
    try {
      const m = String(month).padStart(2, '0');
      const y = String(year);

      // 1️⃣ Get previous month summary if exists
      let prevYear = year;
      let prevMonth = month - 1;

      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }

      const prevSummary = db.prepare(`
        SELECT RemainingFertilizer AS prRemainingFertilizer,
               Arrears AS preArrearss
        FROM CustomerMonthlySummary
        WHERE CustomerID = ? AND Year = ? AND Month = ?
      `).get(customerId, prevYear, prevMonth);

      const prevFertilizer = prevSummary?.prRemainingFertilizer || 0;
      const prevArrears = prevSummary?.preArrearss || 0;

      // 2️⃣ Get current month raw tea payments
      const rawTea = db.prepare(`
        SELECT Date, BestTeaKg, NormalTeaKg, BestTeaRate, NormalTeaRate
        FROM CustomerRawTeaPayment
        WHERE CustomerID = ? 
          AND strftime('%Y', Date) = ? 
          AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      // 3️⃣ Get fertilizer orders for the month
      const fertilizer = db.prepare(`
        SELECT 
          Date, 
          Quantity, 
          FertilizerType,
          Price AS TotalPrice,
          IFNULL(HalfPayment1, 0) AS HalfPayment1,
          IFNULL(HalfPayment2, 0) AS HalfPayment2
        FROM FertilizerOrder
        WHERE CustomerID = ? 
          AND strftime('%Y', Date) = ? 
          AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      // 4️⃣ Tea packet orders
      const teaPacket = db.prepare(`
        SELECT 
          OrderDate AS Date, 
          Quantity, 
          Price, 
          FullTotal
        FROM TeaPacketOrder
        WHERE CustomerID = ? 
          AND strftime('%Y', OrderDate) = ? 
          AND strftime('%m', OrderDate) = ?
        ORDER BY OrderDate ASC
      `).all(customerId, y, m);

      // 5️⃣ Advances
      const advance = db.prepare(`
        SELECT Date, AdvanceAmount
        FROM CustomerAdvance
        WHERE CustomerID = ? 
          AND strftime('%Y', Date) = ? 
          AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      // 6️⃣ Other charges
      const other = db.prepare(`
        SELECT Date, Description, Price
        FROM OtherAdd
        WHERE CustomerID = ? 
          AND strftime('%Y', Date) = ? 
          AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      return {
        rawTea,
        fertilizer,
        teaPacket,
        advance,
        other,
        prevFertilizer,
        prevArrears
      };
    } catch (err) {
      console.error('Error in loadCustomerSummary:', err);
      throw new Error(`Failed to load customer summary: ${err.message}`);
    }
  }

  // ================= Save Calculated Summary to DB =================
  saveCalculatedSummary(summaryData) {
    try {
      const {
        customerId,
        year,
        month,
        totalRawTea,
        paidFertilizer,
        totalTeaPacket,
        advanceTotal,
        otherTotal,
        remainingFertilizer,
        arrears,
        grandTotal,
        prevFertilizer,
        prevArrears
      } = summaryData;

      // Check if record exists
      const existing = db.prepare(`
        SELECT SummaryID FROM CustomerMonthlySummary 
        WHERE CustomerID = ? AND Year = ? AND Month = ?
      `).get(customerId, year, month);

      let summaryId;

      if (existing) {
        summaryId = existing.SummaryID;

        // Update existing record
        const stmt = db.prepare(`
          UPDATE CustomerMonthlySummary 
          SET 
            TotalRawTea = ?,
            PaidFertilizer = ?,
            TotalTeaPacket = ?,
            AdvanceTotal = ?,
            OtherTotal = ?,
            RemainingFertilizer = ?,
            Arrears = ?,
            GrandTotal = ?,
            prRemainingFertilizer = ?,
            preArrearss = ?
          WHERE CustomerID = ? AND Year = ? AND Month = ?
        `);

        stmt.run(
          totalRawTea,
          paidFertilizer,
          totalTeaPacket,
          advanceTotal,
          otherTotal,
          remainingFertilizer,
          arrears,
          grandTotal,
          prevFertilizer,
          prevArrears,
          customerId,
          year,
          month
        );

        console.log(`✅ Updated summary ${summaryId} for ${customerId} - ${year}/${month}`);
      } else {
        // Generate new ID
        summaryId = this.getNextId();

        // Insert new record
        const stmt = db.prepare(`
          INSERT INTO CustomerMonthlySummary (
            SummaryID, CustomerID, Year, Month,
            TotalRawTea, PaidFertilizer, TotalTeaPacket,
            AdvanceTotal, OtherTotal, RemainingFertilizer,
            Arrears, GrandTotal, prRemainingFertilizer, preArrearss
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          summaryId,
          customerId,
          year,
          month,
          totalRawTea,
          paidFertilizer,
          totalTeaPacket,
          advanceTotal,
          otherTotal,
          remainingFertilizer,
          arrears,
          grandTotal,
          prevFertilizer,
          prevArrears
        );

        console.log(`✅ Inserted new summary ${summaryId} for ${customerId} - ${year}/${month}`);
      }

      return {
        success: true,
        summaryId,
        remainingFertilizer,
        arrears
      };
    } catch (err) {
      console.error('Error in saveCalculatedSummary:', err);
      throw new Error(`Failed to save summary: ${err.message}`);
    }
  }

  // ================= Get Summary Record =================
  getSummary(customerId, year, month) {
    try {
      const summary = db.prepare(`
        SELECT * FROM CustomerMonthlySummary
        WHERE CustomerID = ? AND Year = ? AND Month = ?
      `).get(customerId, year, month);

      return summary || null;
    } catch (err) {
      console.error('Error in getSummary:', err);
      throw new Error(`Failed to get summary: ${err.message}`);
    }
  }

  // ================= Get All Summaries for a Month (For Bulk Report) =================
  getSummariesByMonth(year, month) {
    try {
      const summaries = db.prepare(`
        SELECT cms.*, c.Name as CustomerName
        FROM CustomerMonthlySummary cms
        LEFT JOIN Customer c ON cms.CustomerID = c.CustomerID
        WHERE cms.Year = ? AND cms.Month = ?
      `).all(year, month);

      return summaries;
    } catch (err) {
      console.error('Error in getSummariesByMonth:', err);
      throw new Error(`Failed to get monthly summaries: ${err.message}`);
    }
  }

  // ================= Get All Summaries for a Customer =================
  getAllSummariesByCustomer(customerId) {
    try {
      const summaries = db.prepare(`
        SELECT * FROM CustomerMonthlySummary
        WHERE CustomerID = ?
        ORDER BY Year DESC, Month DESC
      `).all(customerId);

      return summaries;
    } catch (err) {
      console.error('Error in getAllSummariesByCustomer:', err);
      throw new Error(`Failed to get summaries: ${err.message}`);
    }
  }
}

export default new CustomerSummaryService();