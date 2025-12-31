// src/main/controllers/teaFactoryController.js
import { ipcMain } from 'electron';
import teaFactoryService from '../services/teaFactoryService.js';

export function registerTeaFactoryHandlers() {
  // Get all
  ipcMain.handle('teaFactory:getAll', () => {
    return teaFactoryService.getAll();
  });

  // Get next ID
  ipcMain.handle('teaFactory:getNextId', () => {
    return teaFactoryService.generateNextId();
  });

  // Add
  ipcMain.handle('teaFactory:add', (event, data) => {
    return teaFactoryService.add(data);
  });

  // Update
  ipcMain.handle('teaFactory:update', (event, data) => {
    return teaFactoryService.update(data);
  });

  // Delete
  ipcMain.handle('teaFactory:delete', (event, factoryId) => {
    return teaFactoryService.delete(factoryId);
  });

  // Search
  ipcMain.handle('teaFactory:search', (event, keyword) => {
    return teaFactoryService.search(keyword);
  });

  console.log('✅ TeaFactory handlers registered');
}