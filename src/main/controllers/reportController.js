import { ipcMain, BrowserWindow, app, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import CustomerSummaryService from '../services/customerMonthlySummry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for Tables
const generateTableHtml = (headers, rows, mapRow) => {
    if (!rows || rows.length === 0) {
        return `<div style="text-align:center; padding:5px; border:1px solid #000; font-size:9pt;">දත්ත නොමැත (No data available)</div>`;
    }
    const tbody = rows.map(mapRow).join('');
    return `
    <table style="width:100%; border-collapse: collapse; margin-bottom:10px; border: 1px solid #000;">
        <thead>
            <tr style="background:#f2f2f2;">
                ${headers.map(h => `<th style="padding:5px; text-align:left; font-size:9pt; border: 1px solid #000;">${h}</th>`).join('')}
            </tr>
        </thead>
        <tbody>${tbody}</tbody>
    </table>`;
};

// Internal PDF Generator
async function generatePDF(data, folderPath) {
    let win;
    try {
        win = new BrowserWindow({
            show: false,
            webPreferences: { nodeIntegration: false, contextIsolation: true }
        });

        let fontPath;
        if (app.isPackaged) {
            fontPath = path.join(process.resourcesPath, 'assets', 'fonts', 'NotoSansSinhala-VariableFont_wdth,wght.ttf');
        } else {
            fontPath = path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansSinhala-VariableFont_wdth,wght.ttf');
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @font-face { font-family: 'Sinhala'; src: url('file://${fontPath.replace(/\\/g, '/')}') format('truetype'); }
        @page { size: A4 landscape; margin: 8mm; }
        
        body { 
            font-family: 'Sinhala', sans-serif; 
            margin: 0; padding: 0; 
            font-size: 9pt; color: #000;
            background-color: #fff;
        }

        .report-wrapper {
            border: 1.5px solid #000;
            padding: 15px;
            border-radius: 5px;
        }

        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
        .bold { font-weight: bold; }
        .flex { display: flex; justify-content: space-between; }
        
        .main-container { display: flex; gap: 15px; }
        
        .left-panel { 
            width: 38%; 
            padding: 10px;
            border-right: 1px solid #000;
        }
        
        .right-panel { width: 62%; }

        .summary-box { margin-bottom: 12px; }
        .summary-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 3px 0; 
            border-bottom: 0.5px solid #000;
        }
        
        .summary-total { 
            border: 1.5px solid #000;
            padding: 5px 10px; 
            margin-top: 8px; 
            font-weight: bold; 
        }

        .table-section { margin-bottom: 15px; }
        .table-title { 
            font-weight: bold; 
            text-decoration: underline;
            margin-bottom: 4px;
            display: block;
        }
        
        .simple-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid #000;
        }
        
        .simple-table th { 
            text-align: left; 
            background: #eee; 
            padding: 5px; 
            border: 1px solid #000;
        }
        
        .simple-table td { 
            padding: 5px; 
            border: 1px solid #000; 
        }

      .grand-total-box { 
    border: 2px solid #000; 
    padding: 12px; 
    margin-top: 15px; 
    text-align: center;
    border-radius: 4px;
}
        .footer-law { 
            margin-top: 15px; 
            font-size: 8pt; 
            text-align: center; 
            border-top: 1px solid #000; 
            padding-top: 5px;
        }

        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
        .sig-box { text-align: center; width: 200px; }
        .line-sig { border-top: 1px solid #000; margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="report-wrapper">
        <div class="header">
            <div style="font-size: 11pt;">බලයලත් අමුතේ දළු වෙළෙන්දෝ</div>
            <div style="font-size: 16pt;" class="bold">තරින්දු ටී සෙන්ටර්</div>
            <div class="flex" style="margin-top: 5px;">
                <span><b>ගනුදෙනුකරු:</b> ${data.customerId} - ${data.customerName}</span>
                <span><b>මාසය:</b> ${data.year} ${data.month}</span>
                <span><b>අංකය:</b> ${data.summaryId}</span>
            </div>
        </div>

        <div class="main-container">
            <div class="left-panel">
                <div class="summary-box">
                    <div class="bold">1. සැපයුම් සාරාංශය (Supply)</div>
                    <div class="summary-row">
                        <span>හොඳ දළු (${parseFloat(data.totalBestKg).toFixed(1)}kg) | Rate:</span> 
                        <span>${parseFloat(data.bestRate).toFixed(2)}</span>
                    </div>
                    <div class="summary-row" style="border-bottom: 1px solid #000;">
                        <span>සාමාන්‍ය දළු (${parseFloat(data.totalNormalKg).toFixed(1)}kg) | Rate:</span> 
                        <span>${parseFloat(data.normalRate).toFixed(2)}</span>
                    </div>
                    <div class="summary-total flex">
                        <span>මුළු වටිනාකම</span> 
                        <span>Rs. ${parseFloat(data.totalRawTea).toFixed(2)}</span>
                    </div>
                </div>

                <div class="summary-box" style="margin-top: 15px;">
                    <div class="bold">2. අඩු කිරීම් (Deductions)</div>
                    <div class="summary-row"><span>පෙර පෝර හිඟය</span> <span>${parseFloat(data.prevFertilizer || 0).toFixed(2)}</span></div>
                    <div class="summary-row"><span>පෙර මුදල් හිඟය</span> <span>${parseFloat(data.prevArrears || 0).toFixed(2)}</span></div>
                    <div class="summary-row"><span>අත්තිකාරම් (Advance)</span> <span>${parseFloat(data.totalAdvance || 0).toFixed(2)}</span></div>
                    <div class="summary-row"><span>තේ පැකට් (Tea Packets)</span> <span>${parseFloat(data.totalTeaPackets || 0).toFixed(2)}</span></div>
                    <div class="summary-row"><span>වෙනත් (Other)</span> <span>${parseFloat(data.totalOtherOnly || 0).toFixed(2)}</span></div>
                    <div class="summary-row"><span>පෝර ගෙවීම් (Fertilizer)</span> <span>${parseFloat(data.paidFertilizer || 0).toFixed(2)}</span></div>
                    <div class="summary-total flex">
                        <span>මුළු අඩු කිරීම් එකතුව</span> 
                        <span>Rs. ${parseFloat(data.totalDeductions).toFixed(2)}</span>
                    </div>
                </div>

                <div class="grand-total-box">
    <div style="font-size: 14pt;" class="bold">GRAND TOTAL: Rs. ${parseFloat(data.grandTotal).toFixed(2)}</div>
    
    <div style="margin-top: 10px; border-top: 1px solid #000; padding-top: 8px; font-size: 9pt; display: flex; justify-content: space-around;">
        <div style="text-align: center;">
            <div class="bold">ඉදිරියට පෝර (Next Fertilizer)</div>
            <div style="font-size: 10pt;">Rs. ${parseFloat(data.nextFertilizer).toFixed(2)}</div>
        </div>
        <div style="text-align: center; border-left: 1px solid #000; padding-left: 15px;">
            <div class="bold">ඉදිරියට හිඟ මුදල (Next Arrears)</div>
            <div style="font-size: 10pt;">Rs. ${parseFloat(data.nextRemaining).toFixed(2)}</div>
        </div>
    </div>
</div>
            </div>

            <div class="right-panel">
                <div class="table-section">
                    <span class="table-title">අත්තිකාරම් (Advance)</span>
                    ${data.advanceTable}
                </div>
                <div class="table-section">
                    <span class="table-title">තේ පැකට් සහ වෙනත් (Tea & Others)</span>
                    ${data.otherTable}
                </div>
                <div class="table-section">
                    <span class="table-title">පෝර විස්තර (Fertilizer)</span>
                    ${data.fertilizerTableHtml}
                </div>
            </div>
        </div>

        <div class="footer-law">
            1957 අංක 51 දරණ තේ පාලන පනත ටී සී 19 දරන ආකෘති පත්‍රය ප්‍රකාර සඳහන් මුදල භාරගනිමි.
        </div>

        <div class="signatures">
            <div class="sig-box"><div class="line-sig"></div>ගනුදෙනුකරුගේ අත්සන</div>
            <div class="sig-box"><div class="line-sig"></div>කළමනාකරුගේ අත්සන</div>
        </div>
    </div>
</body>
</html>`;
        await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
        const pdfPath = path.join(folderPath, `Report_${data.customerId}_${data.summaryId}.pdf`);
        const pdfData = await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true });
        await fs.writeFile(pdfPath, pdfData);
        return { success: true, path: pdfPath };
    } catch (e) { return { success: false, message: e.message }; }
    finally { if (win) win.destroy(); }
}

// ==========================================================
// IMPORTANT: THIS IS THE FUNCTION THAT WAS CAUSING THE ERROR
// ==========================================================
export function registerReportHandlers() {

    ipcMain.handle('report:generateCustomerSummary', async (event, data) => {
        try {
            const folderPath = path.join(app.getPath('documents'), 'Tea Center Reports');
            await fs.mkdir(folderPath, { recursive: true });
            return await generatePDF(data, folderPath);
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('report:generateAllCustomerSummaries', async (event, { year, month }) => {
        try {
            const summaries = CustomerSummaryService.getSummariesByMonth(year, month);
            if (!summaries || summaries.length === 0) return { success: false, message: 'No data found' };

            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
            const folderPath = path.join(app.getPath('documents'), 'Tea Center Reports', `${year}_${monthName}`);
            await fs.mkdir(folderPath, { recursive: true });

            let count = 0;
            for (const s of summaries) {
                const details = CustomerSummaryService.loadCustomerSummary(s.CustomerID, year, month);

                const fertTable = generateTableHtml(['දිනය', 'වර්ගය', 'මුදල'], details.fertilizer,
                    r => `<tr><td style="border:1px solid #000; padding:5px;">${r.Date}</td><td style="border:1px solid #000; padding:5px;">${r.FertilizerType}</td><td style="border:1px solid #000; padding:5px;">${(r.HalfPayment1 || 0).toFixed(2)}</td></tr>`);

                const dedTable = generateTableHtml(['දිනය', 'විස්තරය', 'මුදල'], [...details.advance.map(a => ({ d: a.Date, t: 'අත්තිකාරම්', v: a.AdvanceAmount })), ...details.teaPacket.map(tp => ({ d: tp.Date, t: 'තේ පැකට්', v: tp.FullTotal }))],
                    r => `<tr><td style="border:1px solid #000; padding:5px;">${r.d}</td><td style="border:1px solid #000; padding:5px;">${r.t}</td><td style="border:1px solid #000; padding:5px;" class="text-right">${parseFloat(r.v).toFixed(2)}</td></tr>`);

                await generatePDF({
                    ...s,
                    year, month: monthName,
                    customerId: s.CustomerID, customerName: s.CustomerName, summaryId: s.SummaryID,
                    totalRawTea: s.TotalRawTea, grandTotal: s.GrandTotal,
                    totalDeductions: (s.PaidFertilizer + s.AdvanceTotal + s.TotalTeaPacket + s.OtherTotal),
                    prevArrears: s.preArrearss, nextFertilizer: s.RemainingFertilizer, nextRemaining: s.Arrears,
                    fertilizerTable: fertTable, deductionsTable: dedTable
                }, folderPath);
                count++;
            }
            return { success: true, message: `Created ${count} reports`, path: folderPath };
        } catch (e) { return { success: false, message: e.message }; }
    });

    console.log('✅ Report Handlers Registered');
}