// src/main/controllers/monthlytearateController.js
import { ipcMain } from 'electron';
import MonthlyTeaRateService from '../services/MonthlyTeaRateService.js';

export function registerMonthlyTeaRateHandlers() {
 
 ipcMain.handle('Monthlyrate:getNextId', () => MonthlyTeaRateService.getNextId());
  ipcMain.handle('Monthlyrate:add', (event, data) => {
    return MonthlyTeaRateService.add(data);
  });
  ipcMain.handle(
    'Monthlyrate:loadByYearMonth',
    (e, year, month) =>
      MonthlyTeaRateService.loadByYearMonth(year, month)
  );

  ipcMain.handle('Monthlyrate:update', (e, data) => {
  return MonthlyTeaRateService.update(data);
});


  console.log('✅MonthlyTeaRateService handlers registered');
}