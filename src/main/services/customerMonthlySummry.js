import db from '../database/connection.js';

class CustomerSummaryService {

  // ================= 1. Generate Next ID =================
  // මෙම නම පහත save function එකේදීද පාවිච්චි වේ
  generateNextSummaryId() {
    try {
      // ORDER BY CAST... භාවිතා කරන්නේ CMP9 ට පසු CMP10 නිවැරදිව තේරීමටයි
      const row = db.prepare(`
        SELECT SummaryID 
        FROM CustomerMonthlySummary 
        ORDER BY CAST(SUBSTR(SummaryID, 4) AS INTEGER) DESC 
        LIMIT 1
      `).get();

      if (!row || !row.SummaryID) {
        return 'CMP0001';
      }

      const lastIdNum = parseInt(row.SummaryID.replace(/[^\d]/g, ''));
      const nextIdNum = lastIdNum + 1;

      return `CMP${String(nextIdNum).padStart(4, '0')}`;
    } catch (err) {
      console.error('❌ Error generating Summary ID:', err);
      return 'CMP0001';
    }
  }

  // ================= 2. Load Summary Data =================
  loadCustomerSummary(customerId, year, month) {
    try {
      const m = String(month).padStart(2, '0');
      const y = String(year);

      // 1️⃣ කලින් මාසයේ ඉතිරි පෝර සහ හිඟ මුදල් පරීක්ෂාව
      let prevYear = year;
      let prevMonth = month - 1;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }

      const prevSummary = db.prepare(`
        SELECT RemainingFertilizer, Arrears
        FROM CustomerMonthlySummary
        WHERE CustomerID = ? AND Year = ? AND Month = ?
      `).get(customerId, prevYear, prevMonth);

      // 2️⃣ වර්තමාන මාසයට අදාළ දත්ත ගොනු කිරීම (Raw Tea, Fertilizer, Packets, Advance, Other)
      const rawTea = db.prepare(`
        SELECT Date, BestTeaKg, NormalTeaKg, BestTeaRate, NormalTeaRate
        FROM CustomerRawTeaPayment
        WHERE CustomerID = ? AND strftime('%Y', Date) = ? AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      const fertilizer = db.prepare(`
        SELECT Date, Quantity, FertilizerType, Price AS TotalPrice, 
               IFNULL(HalfPayment1, 0) AS HalfPayment1, IFNULL(HalfPayment2, 0) AS HalfPayment2
        FROM FertilizerOrder
        WHERE CustomerID = ? AND strftime('%Y', Date) = ? AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      const teaPacket = db.prepare(`
        SELECT OrderDate AS Date, Quantity, Price, FullTotal
        FROM TeaPacketOrder
        WHERE CustomerID = ? AND strftime('%Y', OrderDate) = ? AND strftime('%m', OrderDate) = ?
        ORDER BY OrderDate ASC
      `).all(customerId, y, m);

      const advance = db.prepare(`
        SELECT Date, AdvanceAmount
        FROM CustomerAdvance
        WHERE CustomerID = ? AND strftime('%Y', Date) = ? AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      const other = db.prepare(`
        SELECT Date, Description, Price
        FROM OtherAdd
        WHERE CustomerID = ? AND strftime('%Y', Date) = ? AND strftime('%m', Date) = ?
        ORDER BY Date ASC
      `).all(customerId, y, m);

      return {
        rawTea, fertilizer, teaPacket, advance, other,
        prevFertilizer: prevSummary?.RemainingFertilizer || 0,
        prevArrears: prevSummary?.Arrears || 0
      };
    } catch (err) {
      console.error('Error in loadCustomerSummary:', err);
      throw err;
    }
  }

  // ================= 3. Save Calculated Summary =================
  saveCalculatedSummary(summaryData) {
    try {
      const {
        customerId, year, month, totalRawTea, paidFertilizer, totalTeaPacket,
        advanceTotal, otherTotal, remainingFertilizer, arrears, grandTotal,
        prevFertilizer, prevArrears
      } = summaryData;

      // දැනටමත් මේ මාසයට record එකක් තිබේදැයි බලන්න
      const existing = db.prepare(`
        SELECT SummaryID FROM CustomerMonthlySummary 
        WHERE CustomerID = ? AND Year = ? AND Month = ?
      `).get(customerId, year, month);

      let summaryId;

      if (existing) {
        summaryId = existing.SummaryID;
        // UPDATE Existing
        const stmt = db.prepare(`
          UPDATE CustomerMonthlySummary SET 
            TotalRawTea = ?, PaidFertilizer = ?, TotalTeaPacket = ?, AdvanceTotal = ?, 
            OtherTotal = ?, RemainingFertilizer = ?, Arrears = ?, GrandTotal = ?, 
            prRemainingFertilizer = ?, preArrearss = ?
          WHERE SummaryID = ?
        `);
        stmt.run(totalRawTea, paidFertilizer, totalTeaPacket, advanceTotal, otherTotal,
          remainingFertilizer, arrears, grandTotal, prevFertilizer, prevArrears, summaryId);
      } else {
        // ✅ මෙතැනයි වැරැද්ද තිබුණේ - නිවැරදි Method නම පාවිච්චි කර ඇත
        summaryId = this.generateNextSummaryId();

        // INSERT New
        const stmt = db.prepare(`
          INSERT INTO CustomerMonthlySummary (
            SummaryID, CustomerID, Year, Month, TotalRawTea, PaidFertilizer, 
            TotalTeaPacket, AdvanceTotal, OtherTotal, RemainingFertilizer, 
            Arrears, GrandTotal, prRemainingFertilizer, preArrearss
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(summaryId, customerId, year, month, totalRawTea, paidFertilizer,
          totalTeaPacket, advanceTotal, otherTotal, remainingFertilizer,
          arrears, grandTotal, prevFertilizer, prevArrears);
      }

      return { success: true, summaryId };
    } catch (err) {
      console.error('❌ Error in saveCalculatedSummary:', err);
      throw err;
    }
  }

  // ================= 4. Additional Getters =================
  getSummariesByMonth(year, month) {
    return db.prepare(`
      SELECT cms.*, c.Name as CustomerName
      FROM CustomerMonthlySummary cms
      LEFT JOIN Customer c ON cms.CustomerID = c.CustomerID
      WHERE cms.Year = ? AND cms.Month = ?
    `).all(year, month);
  }
}

export default new CustomerSummaryService();