// src/models/customerMonthlySummaryModel.js

class CustomerMonthlySummary {
    constructor({
        SummaryID = null,
        CustomerID = "",
        Year = new Date().getFullYear(),
        Month = new Date().getMonth() + 1, // 1-12
        TotalRawTea = 0,
        PaidFertilizer = 0,
        TotalTeaPacket = 0,
        AdvanceTotal = 0,
        OtherTotal = 0,
        RemainingFertilizer = 0,
        Arrears = 0,
        GrandTotal = 0,
        prRemainingFertilizer = 0,
        preArrearss = 0
    } = {}) {
        this._SummaryID = SummaryID;
        this._CustomerID = CustomerID;
        this._Year = parseInt(Year) || new Date().getFullYear();
        this._Month = parseInt(Month) || new Date().getMonth() + 1;
        this._TotalRawTea = parseFloat(TotalRawTea) || 0;
        this._PaidFertilizer = parseFloat(PaidFertilizer) || 0;
        this._TotalTeaPacket = parseFloat(TotalTeaPacket) || 0;
        this._AdvanceTotal = parseFloat(AdvanceTotal) || 0;
        this._OtherTotal = parseFloat(OtherTotal) || 0;
        this._RemainingFertilizer = parseFloat(RemainingFertilizer) || 0;
        this._Arrears = parseFloat(Arrears) || 0;
        this._GrandTotal = parseFloat(GrandTotal) || 0;
        this._prRemainingFertilizer = parseFloat(prRemainingFertilizer) || 0;
        this._preArrearss = parseFloat(preArrearss) || 0;
    }

    // Getters
    get SummaryID() { return this._SummaryID; }
    get CustomerID() { return this._CustomerID; }
    get Year() { return this._Year; }
    get Month() { return this._Month; }
    get TotalRawTea() { return this._TotalRawTea; }
    get PaidFertilizer() { return this._PaidFertilizer; }
    get TotalTeaPacket() { return this._TotalTeaPacket; }
    get AdvanceTotal() { return this._AdvanceTotal; }
    get OtherTotal() { return this._OtherTotal; }
    get RemainingFertilizer() { return this._RemainingFertilizer; }
    get Arrears() { return this._Arrears; }
    get GrandTotal() { return this._GrandTotal; }
    get prRemainingFertilizer() { return this._prRemainingFertilizer; }
    get preArrearss() { return this._preArrearss; }

    // Validation
    validate() {
        const errors = [];
        if (!this._CustomerID) errors.push("CustomerID is required");
        if (!this._Year) errors.push("Year is required");
        if (!this._Month) errors.push("Month is required");
        return { valid: errors.length === 0, errors };
    }

    // Convert to JSON for DB or API
    toJSON() {
        return {
            SummaryID: this._SummaryID,
            CustomerID: this._CustomerID,
            Year: this._Year,
            Month: this._Month,
            TotalRawTea: this._TotalRawTea,
            PaidFertilizer: this._PaidFertilizer,
            TotalTeaPacket: this._TotalTeaPacket,
            AdvanceTotal: this._AdvanceTotal,
            OtherTotal: this._OtherTotal,
            RemainingFertilizer: this._RemainingFertilizer,
            Arrears: this._Arrears,
            GrandTotal: this._GrandTotal,
            prRemainingFertilizer: this._prRemainingFertilizer,
            preArrearss: this._preArrearss
        };
    }

    // Create instance from DB row
    static fromDB(row) {
        return new CustomerMonthlySummary({
            SummaryID: row.SummaryID,
            CustomerID: row.CustomerID,
            Year: row.Year,
            Month: row.Month,
            TotalRawTea: row.TotalRawTea,
            PaidFertilizer: row.PaidFertilizer,
            TotalTeaPacket: row.TotalTeaPacket,
            AdvanceTotal: row.AdvanceTotal,
            OtherTotal: row.OtherTotal,
            RemainingFertilizer: row.RemainingFertilizer,
            Arrears: row.Arrears,
            GrandTotal: row.GrandTotal,
            prRemainingFertilizer: row.prRemainingFertilizer,
            preArrearss: row.preArrearss
        });
    }
}

export default CustomerMonthlySummary;
