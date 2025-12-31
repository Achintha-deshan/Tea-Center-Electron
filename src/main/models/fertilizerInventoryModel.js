// src/main/models/fertilizerInventoryModel.js
class FertilizerInventory {
  constructor(data = {}) {
    this.FInventoryId = data.FInventoryId || '';
    this.Fertilizer = data.Fertilizer || '';
    this.Quantity = parseFloat(data.Quantity) || 0;
    this.BuyPrice = parseFloat(data.BuyPrice) || 0;
    this.SellPrice = parseFloat(data.SellPrice) || 0;
    this.Date = data.Date || '';
  }

  validate() {
    const errors = [];

    if (!this.FInventoryId || this.FInventoryId.trim() === '') {
      errors.push('Inventory ID is required');
    }

    if (!this.Fertilizer || this.Fertilizer.trim() === '') {
      errors.push('Fertilizer type is required');
    }

    const validFertilizers = ['T200', 'T750', 'U709', '1625', 'T65', 'Dolamite'];
    if (!validFertilizers.includes(this.Fertilizer)) {
      errors.push('Invalid fertilizer type');
    }

    if (this.Quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (this.BuyPrice <= 0) {
      errors.push('Buy price must be greater than 0');
    }

    if (this.SellPrice <= 0) {
      errors.push('Selling price must be greater than 0');
    }

    if (this.SellPrice < this.BuyPrice) {
      errors.push('Selling price should not be less than buy price');
    }

    if (!this.Date || this.Date.trim() === '') {
      errors.push('Date is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static fromDB(row) {
    return new FertilizerInventory({
      FInventoryId: row.FInventoryId,
      Fertilizer: row.Fertilizer,
      Quantity: row.Quantity,
      BuyPrice: row.BuyPrice,
      SellPrice: row.SellPrice,
      Date: row.Date
    });
  }

  toJSON() {
    return {
      FInventoryId: this.FInventoryId,
      Fertilizer: this.Fertilizer,
      Quantity: this.Quantity,
      BuyPrice: this.BuyPrice,
      SellPrice: this.SellPrice,
      Date: this.Date
    };
  }
}

export default FertilizerInventory;