class FertilizerOrder {
  constructor({
    OrderID = null,
    CustomerID = "",
    FInventoryID = "",
    FertilizerType = "",
    Quantity = 0,
    Price = 0,
    TransporterID = null,
    TransportFee = 0,
    Date = new Date().toISOString().split('T')[0],
    HalfPayment1 = 0,
    HalfPayment2 = 0,
  } = {}) {

    this.OrderID = OrderID;
    this.CustomerID = CustomerID;
    this.FInventoryID = FInventoryID;
    this.FertilizerType = FertilizerType.trim();
    this.Quantity = Number(Quantity) || 0;
    this.Price = Number(Price) || 0;
    this.TransporterID = TransporterID;
    this.TransportFee = Number(TransportFee) || 0;
    this.Date = Date;
    this.HalfPayment1 = Number(HalfPayment1) || 0;
    this.HalfPayment2 = Number(HalfPayment2) || 0;
  }

  // ================= VALIDATION =================
  validate() {
    const errors = [];

    if (!this.CustomerID) errors.push("Customer is required");
    if (!this.FInventoryID) errors.push("Inventory is required");
    if (!this.FertilizerType) errors.push("Fertilizer type is required");
    if (this.Quantity <= 0) errors.push("Quantity must be greater than 0");
    if (this.Price <= 0) errors.push("Price must be greater than 0");
    if (!this.Date) errors.push("Date is required");

    return { valid: errors.length === 0, errors };
  }



  // ================= TO JSON (Renderer) =================
  toJSON() {
    return {
      OrderID: this.OrderID,
      CustomerID: this.CustomerID,
      FInventoryID: this.FInventoryID,
      FertilizerType: this.FertilizerType,
      Quantity: this.Quantity,
      Price: this.Price,
      TransporterID: this.TransporterID,
      TransportFee: this.TransportFee,
      Date: this.Date,
      HalfPayment1: this.HalfPayment1,
      HalfPayment2: this.HalfPayment2
    };
  }

  // ================= FROM DB =================
  static fromDB(row) {
    return new FertilizerOrder({
      OrderID: row.OrderID,
      CustomerID: row.CustomerID,
      FInventoryID: row.FInventoryID,
      FertilizerType: row.FertilizerType,
      Quantity: row.Quantity,
      Price: row.Price,
      TransporterID: row.TransporterID,
      TransportFee: row.TransportFee,
      Date: row.Date,
      HalfPayment1: row.HalfPayment1,
      HalfPayment2: row.HalfPayment2,
    });
  }
}

export default FertilizerOrder;
