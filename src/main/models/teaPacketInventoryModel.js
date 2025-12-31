class TeaPacketInventory {
  constructor({ TPinventoryId, TeaType, BuyPrice, SellPrice, TeaPacket, TeaPacketQTY, Date }) {
    this.TPinventoryId = TPinventoryId || '';
    this.TeaType = TeaType || '';
    this.BuyPrice = BuyPrice || 0;
    this.SellPrice = SellPrice || 0;
    this.TeaPacket = TeaPacket || '';
    this.TeaPacketQTY = TeaPacketQTY || 0;
    this.Date = Date || new Date().toISOString().split('T')[0];
  }

  validate() {
    const errors = [];
    if (!this.TeaType) errors.push('TeaType required');
    if (!this.TeaPacket) errors.push('TeaPacket size required');
    if (this.TeaPacketQTY <= 0) errors.push('Quantity must be > 0');
    if (this.BuyPrice <= 0) errors.push('BuyPrice must be > 0');
    if (this.SellPrice <= 0) errors.push('SellPrice must be > 0');
    return { valid: errors.length === 0, errors };
  }

  static fromDB(row) {
    return new TeaPacketInventory(row);
  }

  toJSON() {
    return { ...this };
  }
}

export default TeaPacketInventory;
