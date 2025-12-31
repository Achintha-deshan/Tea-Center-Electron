// src/main/controllers/customerController.js
import { ipcMain } from 'electron';
import customerService from '../services/customerService.js';

export function registerCustomerHandlers() {
  // Get all customers
  ipcMain.handle('customer:getAll', () => {
    return customerService.getAll();
  });

  // Get next customer ID
  ipcMain.handle('customer:getNextId', () => {
    return customerService.getNextId();
  });

  // Add customer
  ipcMain.handle('customer:add', (event, data) => {
    return customerService.add(data);
  });

  // Update customer
  ipcMain.handle('customer:update', (event, data) => {
    return customerService.update(data);
  });

  // Delete customer
  ipcMain.handle('customer:delete', (event, customerId) => {
    return customerService.delete(customerId);
  });

  // Get customer by ID
  ipcMain.handle('customer:getById', (event, customerId) => {
    return customerService.getById(customerId);
  });

  // Search customers
  ipcMain.handle('customer:search', (event, searchTerm) => {
    return customerService.search(searchTerm);
  });

  console.log('✅ Customer handlers registered');
}