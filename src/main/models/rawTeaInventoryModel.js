class RawTeaInventory {
  constructor({
    RAWTEAInventoryID = null,
    CustomerID = "",
    CustomerName = "",
    EmployeeID = null,
    EmployeeName = "",
    QuantityKg = 0,
    GrossValue = 0,
    NetValue = 0,
    TransportFee = 0,
    FactoryTransportFee = 0,
    TeaType = "Normal Tea",
    Date = new Date().toISOString().split('T')[0]
  } = {}) {
    this._RAWTEAInventoryID = RAWTEAInventoryID;
    this._CustomerID = CustomerID;
    this._CustomerName = CustomerName;
    this._EmployeeID = EmployeeID || null;
    this._EmployeeName = EmployeeName || "";
    this._QuantityKg = parseFloat(QuantityKg) || 0;
    this._GrossValue = parseFloat(GrossValue) || 0;
    this._NetValue = parseFloat(NetValue) || 0;
    this._TransportFee = parseFloat(TransportFee) || 0;
    this._FactoryTransportFee = parseFloat(FactoryTransportFee) || 0;
    this._TeaType = TeaType;
    this._Date = Date;
  }

  // Getters
  get RAWTEAInventoryID() { return this._RAWTEAInventoryID; }
  get CustomerID() { return this._CustomerID; }
  get CustomerName() { return this._CustomerName; }
  get EmployeeID() { return this._EmployeeID; }
  get EmployeeName() { return this._EmployeeName; }
  get QuantityKg() { return this._QuantityKg; }
  get GrossValue() { return this._GrossValue; }
  get NetValue() { return this._NetValue; }
  get TransportFee() { return this._TransportFee; }
  get FactoryTransportFee() { return this._FactoryTransportFee; }
  get TeaType() { return this._TeaType; }
  get Date() { return this._Date; }

  validate() {
    const errors = [];
    if (!this._CustomerID) errors.push('Customer is required');
    if (this._QuantityKg <= 0) errors.push('Quantity must be > 0');
    if (!this._Date) errors.push('Date is required');
    return { valid: errors.length === 0, errors };
  }

  toJSON() {
    return {
      RAWTEAInventoryID: this._RAWTEAInventoryID,
      CustomerID: this._CustomerID,              // ⭐ මෙය add කළා
      CustomerName: this._CustomerName,
      EmployeeID: this._EmployeeID,              // ⭐ මෙයත් add කළා
      EmployeeName: this._EmployeeName || "---",
      QuantityKg: this._QuantityKg,
      GrossValue: this._GrossValue,
      NetValue: this._NetValue,
      TransportFee: this._TransportFee,
      FactoryTransportFee: this._FactoryTransportFee,
      TeaType: this._TeaType,
      Date: this._Date
    };
  }

  static fromDB(row, customerName = "", employeeName = "") {
    return new RawTeaInventory({
      RAWTEAInventoryID: row.RAWTEAInventoryID,
      CustomerID: row.CustomerID,
      CustomerName: customerName,
      EmployeeID: row.EmployeeID,
      EmployeeName: employeeName,
      QuantityKg: row.QuantityKg,
      GrossValue: row.GrossValue,
      NetValue: row.NetValue,
      TransportFee: row.TransportFee,
      FactoryTransportFee: row.FactoryTransportFee,
      TeaType: row.TeaType,
      Date: row.Date
    });
  }
}

export default RawTeaInventory;