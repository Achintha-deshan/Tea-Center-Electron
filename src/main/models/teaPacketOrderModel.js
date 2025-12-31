class TeaPacketOrder {
  constructor({ OrderID, CustomerID, TPinventoryId, Quantity, Price, FullTotal, OrderDate }) {
    this.OrderID = OrderID || '';
    this.CustomerID = CustomerID || '';
    this.TPinventoryId = TPinventoryId || '';
    this.Quantity = Quantity || 0;
    this.Price = Price || 0;
    this.FullTotal = FullTotal || 0;
    this.OrderDate = OrderDate || new Date().toISOString().split('T')[0];
  }

  validate() {
    const errors = [];
    if (!this.CustomerID) errors.push('Customer required');
    if (!this.TPinventoryId) errors.push('Inventory required');
    if (this.Quantity <= 0) errors.push('Quantity must be > 0');
    if (this.Price <= 0) errors.push('Price must be > 0');
    return { valid: errors.length === 0, errors };
  }

  static fromDB(row) {
    return new TeaPacketOrder(row);
  }

  toJSON() {
    return { ...this };
  }
}

export default TeaPacketOrder;
