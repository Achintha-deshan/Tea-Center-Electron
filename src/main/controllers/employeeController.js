// src/main/controllers/employeeController.js
import { ipcMain } from 'electron';
import employeeService from '../services/employeeService.js';

export function registerEmployeeHandlers() {
  // Get all employees
  ipcMain.handle('employee:getAll', () => {
    return employeeService.getAll();
  });

 // Get next employee ID
ipcMain.handle('employee:getNextId', () => {
  return employeeService.generateEmployeeId();
});


  // Add new employee
  ipcMain.handle('employee:add', (event, data) => {
    return employeeService.add(data);
  });

  // Update employee
  ipcMain.handle('employee:update', (event, data) => {
    return employeeService.update(data);
  });

  // Delete employee
  ipcMain.handle('employee:delete', (event, employeeId) => {
    return employeeService.delete(employeeId);
  });

  // Search employees
  ipcMain.handle('employee:search', (event, keyword) => {
    return employeeService.search(keyword);
  });

  console.log('✅ Employee handlers registered');
}