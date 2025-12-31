// src/renderer/js/pages/customer.js (jQuery version)
console.log('customer.js loaded');

class CustomersPage {
  constructor() {
    this.selectedCustomer = null;
  }

  async init() {
    await this.loadCustomers();
    await this.generateNextId();
    this.setupEventListeners();
    this.setAddMode();
  }

  async generateNextId() {
    try {
      const nextId = await window.api.customer.getNextId();
      $('#txtDisplayCustomerId, #txtCustomerId').val(nextId);
    } catch (err) {
      console.error('ID generate error:', err);
    }
  }

  async loadCustomers() {
    try {
      const customers = await window.api.customer.getAll();
      const $tbody = $('#tblCustomers');
      $tbody.empty();

      customers.forEach(c => {
        const $tr = $('<tr>')
          .addClass('hover:bg-cyan-50 cursor-pointer transition')
          .on('click', () => this.selectCustomer(c));

        $tr.html(`
          <td class="px-6 py-4 font-bold text-cyan-700">${c.CustomerID}</td>
          <td class="px-6 py-4">${c.Name}</td>
          <td class="px-6 py-4">${c.Address || '-'}</td>
          <td class="px-6 py-4">${c.Phone || '-'}</td>
          <td class="px-6 py-4 text-center">
            <span class="px-3 py-1 rounded-full text-xs font-bold ${c.needsTransport ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
              ${c.needsTransport ? 'Yes' : 'No'}
            </span>
          </td>
        `);

        $tbody.append($tr);
      });
    } catch (err) {
      this.showNotification('Failed to load customers', 'error');
    }
  }

  selectCustomer(customer) {
    this.selectedCustomer = customer;

    $('#txtCustomerId').val(customer.CustomerID);
    $('#txtDisplayCustomerId').val(customer.CustomerID);
    $('#txtCustomerName').val(customer.Name);
    $('#txtCustomerAddress').val(customer.Address || '');
    $('#txtCustomerPhone').val(customer.Phone || '');
    $('#chkTransport').prop('checked', customer.TransportRequired === 1);

    this.setEditMode();
  }

  setupEventListeners() {
    $('#btnCustomerAdd').on('click', () => this.addCustomer());
    $('#btnCustomerUpdate').on('click', () => this.updateCustomer());
    $('#btnCustomerDelete').on('click', () => this.deleteCustomer());
    $('#btnCustomerClear').on('click', () => this.clearForm());
  }

  getFormData() {
    return {
      CustomerID: $('#txtCustomerId').val().trim(),
      Name: $('#txtCustomerName').val().trim(),
      Address: $('#txtCustomerAddress').val().trim(),
      Phone: $('#txtCustomerPhone').val().trim(),
      TransportRequired: $('#chkTransport').is(':checked') ? 1 : 0
    };
  }

 async addCustomer() {
  const fullData = this.getFormData();

  if (!fullData.Name) {
    this.showNotification('Name is required!', 'error');
    return;
  }

  // IMPORTANT: Do NOT send CustomerID when adding new customer
  const dataToSend = {
    Name: fullData.Name,
    Address: fullData.Address || '',
    Phone: fullData.Phone || '',
    TransportRequired: fullData.TransportRequired
  };

  try {
    console.log('Sending to add:', dataToSend);  // ← Add this for debugging

    const result = await window.api.customer.add(dataToSend);

    console.log('Add result:', result);  // ← Check what backend returns

    if (result && result.success) {
      this.showNotification('Customer added successfully!', 'success');
      await this.clearForm();
      await this.loadCustomers();
    } else {
      this.showNotification(result?.message || 'Failed to add customer', 'error');
    }
  } catch (err) {
    console.error('Add customer error:', err);
    this.showNotification('Error: Could not connect to database', 'error');
  }
}

  async updateCustomer() {
    if (!this.selectedCustomer) {
      this.showNotification('Select a customer first', 'error');
      return;
    }

    const data = this.getFormData();
    if (!data.Name) {
      this.showNotification('Name is required!', 'error');
      return;
    }

    try {
      const result = await window.api.customer.update(data);
      if (result.success) {
        this.showNotification('Updated successfully', 'success');
        this.clearForm();
        await this.loadCustomers();
      } else {
        this.showNotification(result.message || 'Update failed', 'error');
      }
    } catch (err) {
      this.showNotification('Network error', 'error');
    }
  }

  async deleteCustomer() {
    if (!this.selectedCustomer) {
      this.showNotification('Please select a customer to delete', 'error');
      return;
    }

    try {
      const result = await window.api.customer.delete(this.selectedCustomer.CustomerID);
      if (result.success) {
        this.showNotification('Customer deleted successfully', 'success');
        this.clearForm();
        await this.loadCustomers();
      } else {
        this.showNotification(result.message || 'Delete failed', 'error');
      }
    } catch (err) {
      this.showNotification('Delete failed', 'error');
    }
  }

  clearForm() {
    this.selectedCustomer = null;

    $('#txtCustomerName, #txtCustomerAddress, #txtCustomerPhone').val('');
    $('#chkTransport').prop('checked', false);

    this.generateNextId();
    this.setAddMode();
  }

  setAddMode() {
    $('#btnCustomerAdd')
      .prop('disabled', false)
      .removeClass('opacity-50 cursor-not-allowed');

    $('#btnCustomerUpdate, #btnCustomerDelete')
      .prop('disabled', true)
      .addClass('opacity-50 cursor-not-allowed');
  }

  setEditMode() {
    $('#btnCustomerAdd')
      .prop('disabled', true)
      .addClass('opacity-50 cursor-not-allowed');

    $('#btnCustomerUpdate, #btnCustomerDelete')
      .prop('disabled', false)
      .removeClass('opacity-50 cursor-not-allowed');
  }

  showNotification(message, type = 'success') {
    // Remove old toasts first
    $('.custom-toast').remove();

    const $toast = $('<div>')
      .addClass('custom-toast fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 transition-all duration-300')
      .addClass(type === 'success' ? 'bg-green-600' : 'bg-red-600')
      .text(message);

    $('body').append($toast);

    setTimeout(() => {
      $toast.addClass('opacity-0');
      setTimeout(() => $toast.remove(), 300);
    }, 2500);
  }
}

// Global instance
const customersPage = new CustomersPage();

$(document).ready(() => {
  customersPage.init();
});