// =================== Global Variables ===================
const yearSelect = $('#cmbSummaryYear');
const monthSelect = $('#cmbSummaryMonth');
const customerSelect = $('#cmbSummaryCustomerID');
const customerNameInput = $('#lblSummaryCustomerName');
const summaryIdLabel = $('#lblCustomerMPID');

let loadedSummaryData = null;

$(document).ready(async function () {
    fillYears();
    fillMonths();
    await loadCustomers();
    await generateNextId();
});

// --- Helper: Reset Form ---
function resetForm() {
    loadedSummaryData = null;
    customerSelect.val('').trigger('change');
    customerNameInput.val('-');
    $('.summary-val').text('Rs 0.00');
    $('table tbody').empty().append('<tr><td colspan="10" class="text-center text-muted py-3">No data available</td></tr>');
    $('#btnGenerateReport').prop('disabled', true);
    $('#btnCalculateSummary').prop('disabled', false);
    generateNextId();
}

function fillYears() {
    yearSelect.empty();
    const currentYear = new Date().getFullYear();
    for (let y = 2020; y <= 2035; y++) {
        yearSelect.append(`<option value="${y}">${y}</option>`);
    }
    yearSelect.val(currentYear);
}

function fillMonths() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthSelect.empty();
    months.forEach((m, i) => { monthSelect.append(`<option value="${i + 1}">${m}</option>`); });
    monthSelect.val(new Date().getMonth() + 1);
}

async function loadCustomers() {
    try {
        const res = await window.api.customer.getAll();
        customerSelect.empty().append('<option value="">Select Customer</option>');
        res.forEach(c => {
            customerSelect.append(`<option value="${c.CustomerID}" data-name="${c.Name}">${c.CustomerID}</option>`);
        });
    } catch (err) { console.error('Error loading customers:', err); }
}

async function generateNextId() {
    try {
        const nextId = await window.api.summary.getNextId();
        summaryIdLabel.text(nextId);
    } catch (err) { console.error('ID generate error:', err); }
}

customerSelect.on('change', function () {
    const name = $(this).find(':selected').data('name') || '-';
    customerNameInput.val(name);
});

// =================== 1. Load Data ===================
$('#btnLoadSummaryData').click(async () => {
    const customerId = customerSelect.val();
    const year = parseInt(yearSelect.val());
    const month = parseInt(monthSelect.val());

    if (!customerId) return alert('කරුණාකර ග්‍රාහකයෙකු තෝරන්න');

    try {
        $('#btnLoadSummaryData').prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Loading...');
        const res = await window.api.summary.load({ customerId, year, month });

        if (res.success && res.data) {
            loadedSummaryData = { customerId, year, month, ...res.data };
            $('#lblPrevFertilizerRemaining').text(`Rs ${(res.data.prevFertilizer || 0).toFixed(2)}`);
            $('#lblPrevRemainingAmount').text(`Rs ${(res.data.prevArrears || 0).toFixed(2)}`);

            renderTable('#tblSummaryRawTea', res.data.rawTea || [], 'rawTea');
            renderTable('#tblSummaryFertilizer', res.data.fertilizer || [], 'fertilizer');
            renderTable('#tblSummaryTeaPacket', res.data.teaPacket || [], 'teaPacket');
            renderTable('#tblSummaryAdvance', res.data.advance || [], 'advance');
            renderTable('#tblSummaryOther', res.data.other || [], 'other');

            $('#btnGenerateReport').prop('disabled', true);
            alert('දත්ත සාර්ථකව පූරණය විය!');
        } else {
            alert('දත්ත හමු නොවීය!');
        }
    } catch (err) { alert('Load Error: ' + err.message); }
    finally { $('#btnLoadSummaryData').prop('disabled', false).text('Load Data'); }
});

function renderTable(selector, data, type) {
    const tbody = $(selector);
    tbody.empty();
    if (!data || data.length === 0) {
        const cols = (type === 'rawTea') ? 6 : (type === 'fertilizer' ? 5 : 4);
        return tbody.append(`<tr><td colspan="${cols}" class="text-center text-muted py-3">No data available</td></tr>`);
    }
    data.forEach(row => {
        let tr = `<tr><td>${row.Date || row.OrderDate || '-'}</td>`;
        if (type === 'rawTea') {
            const bt = (row.BestTeaKg || 0) * (row.BestTeaRate || 0);
            const nt = (row.NormalTeaKg || 0) * (row.NormalTeaRate || 0);
            tr += `<td>${row.BestTeaKg}</td><td>${row.NormalTeaKg}</td><td>${bt.toFixed(2)}</td><td>${nt.toFixed(2)}</td><td class="fw-bold">${(bt + nt).toFixed(2)}</td>`;
        } else if (type === 'fertilizer') {
            tr += `<td>${row.Quantity}</td><td>${row.FertilizerType}</td><td>${(row.HalfPayment1 || 0).toFixed(2)}</td><td>${(row.HalfPayment2 || 0).toFixed(2)}</td>`;
        } else if (type === 'teaPacket') {
            tr += `<td>${row.Quantity}</td><td>${(row.Price || 0).toFixed(2)}</td><td class="fw-bold">${(row.FullTotal || 0).toFixed(2)}</td>`;
        } else if (type === 'advance') {
            tr += `<td class="fw-bold">${(row.AdvanceAmount || 0).toFixed(2)}</td>`;
        } else if (type === 'other') {
            tr += `<td>${row.Description}</td><td>${(row.Price || 0).toFixed(2)}</td>`;
        }
        tr += `</tr>`;
        tbody.append(tr);
    });
}

// =================== 3. Calculate & Save ===================
$('#btnCalculateSummary').click(async () => {
    if (!loadedSummaryData) return alert('කරුණාකර ප්‍රථමයෙන් දත්ත පූරණය කරන්න!');
    try {
        const d = loadedSummaryData;
        const totalBestKg = d.rawTea.reduce((s, r) => s + (r.BestTeaKg || 0), 0);
        const totalNormalKg = d.rawTea.reduce((s, r) => s + (r.NormalTeaKg || 0), 0);
        const bestRate = d.rawTea.length > 0 ? (d.rawTea[0].BestTeaRate || 0) : 0;
        const normalRate = d.rawTea.length > 0 ? (d.rawTea[0].NormalTeaRate || 0) : 0;

        const totalRawTea = (totalBestKg * bestRate) + (totalNormalKg * normalRate);
        const totalTeaPacket = d.teaPacket.reduce((s, r) => s + (r.FullTotal || 0), 0);
        const totalAdvance = d.advance.reduce((s, r) => s + (r.AdvanceAmount || 0), 0);
        const totalOther = d.other.reduce((s, r) => s + (r.Price || 0), 0);
        const paidFertilizer = d.fertilizer.reduce((s, r) => s + (r.HalfPayment1 || 0), 0);
        const remainingFertilizer = d.fertilizer.reduce((s, r) => s + (r.HalfPayment2 || 0), 0);

        const totalDeductions = (d.prevFertilizer || 0) + (d.prevArrears || 0) + totalTeaPacket + totalAdvance + totalOther + paidFertilizer;
        const netValue = totalRawTea - totalDeductions;
        const nextArrears = netValue < 0 ? Math.abs(netValue) : 0;
        const finalPayable = netValue > 0 ? netValue : 0;

        $('#lblSummaryTotalRawTea').text(`Rs ${totalRawTea.toFixed(2)}`);
        $('#lblSummaryTotalTeaPacket').text(`Rs ${totalTeaPacket.toFixed(2)}`);
        $('#lblSummaryTotalAdvance').text(`Rs ${totalAdvance.toFixed(2)}`);
        $('#lblSummaryTotalOther').text(`Rs ${totalOther.toFixed(2)}`);
        $('#lblSummaryTotalFertilizer').text(`Rs ${paidFertilizer.toFixed(2)}`);
        $('#lblSummaryNextFertilizer').text(`Rs ${remainingFertilizer.toFixed(2)}`);
        $('#lblSummaryGrandTotal').text(`Rs ${finalPayable.toFixed(2)}`);
        $('#lblSummaryNextRemaining').text(`Rs ${nextArrears.toFixed(2)}`);

        const saveRes = await window.api.summary.calculate({
            customerId: d.customerId, year: d.year, month: d.month,
            totalRawTea, paidFertilizer, totalTeaPacket, advanceTotal: totalAdvance,
            otherTotal: totalOther, remainingFertilizer, arrears: nextArrears,
            grandTotal: finalPayable, prevFertilizer: d.prevFertilizer, prevArrears: d.prevArrears
        });

        if (saveRes.success) {
            summaryIdLabel.text(saveRes.data.summaryId);
            $('#btnGenerateReport').prop('disabled', false);
            alert('ගණනය කිරීම අවසන්!');
        }
    } catch (err) { alert('Calculate Error: ' + err.message); }
});

// =================== 4. Report Generation ===================
$('#btnGenerateReport').click(async () => {
    if (!loadedSummaryData) return;
    try {
        const d = loadedSummaryData;
        const totalTeaPacket = d.teaPacket.reduce((s, r) => s + (r.FullTotal || 0), 0);
        const totalOtherOnly = d.other.reduce((s, r) => s + (r.Price || 0), 0);
        const totalAdvance = d.advance.reduce((s, r) => s + (r.AdvanceAmount || 0), 0);
        const paidFertilizer = d.fertilizer.reduce((s, r) => s + (r.HalfPayment1 || 0), 0);
        const totalRawTeaValue = d.rawTea.reduce((s, r) => s + (r.BestTeaKg * r.BestTeaRate) + (r.NormalTeaKg * r.NormalTeaRate), 0);

        const reportData = {
            summaryId: summaryIdLabel.text(),
            customerId: d.customerId,
            customerName: customerNameInput.val(),
            year: yearSelect.val(),
            month: monthSelect.find(':selected').text(),

            totalBestKg: d.rawTea.reduce((s, r) => s + (r.BestTeaKg || 0), 0),
            totalNormalKg: d.rawTea.reduce((s, r) => s + (r.NormalTeaKg || 0), 0),
            bestRate: d.rawTea.length > 0 ? d.rawTea[0].BestTeaRate : 0,
            normalRate: d.rawTea.length > 0 ? d.rawTea[0].NormalTeaRate : 0,
            totalRawTea: totalRawTeaValue,

            prevFertilizer: d.prevFertilizer || 0,
            prevArrears: d.prevArrears || 0,
            totalAdvance: totalAdvance,
            totalTeaPackets: totalTeaPacket,
            totalOtherOnly: totalOtherOnly,
            paidFertilizer: paidFertilizer,
            totalDeductions: (d.prevFertilizer + d.prevArrears + totalTeaPacket + totalAdvance + totalOtherOnly + paidFertilizer),

            grandTotal: parseFloat($('#lblSummaryGrandTotal').text().replace('Rs ', '')),
            nextFertilizer: d.fertilizer.reduce((s, r) => s + (r.HalfPayment2 || 0), 0),
            nextRemaining: parseFloat($('#lblSummaryNextRemaining').text().replace('Rs ', '')),

            // වගු සඳහා HTML Helper Functions මෙතැනදී කැඳවනු ලැබේ
            advanceTable: generateAdvanceTableHtml(d.advance),
            otherTable: generateOtherTableHtml(d.teaPacket, d.other),
            fertilizerTableHtml: generateFertilizerTableHtml(d.fertilizer)
        };

        $('#btnGenerateReport').prop('disabled', true).text('Generating...');
        const result = await window.api.report.generateCustomerSummary(reportData);
        if (result.success) {
            alert('වාර්තාව සාර්ථකව නිපදවන ලදී!');
            resetForm();
        }
    } catch (error) { alert('Report Error: ' + error.message); }
    finally { $('#btnGenerateReport').prop('disabled', false).text('Generate Report'); }
});

// =================== 5. Table Helper Functions (For PDF) ===================

function generateAdvanceTableHtml(advances) {
    let rows = advances && advances.length > 0
        ? advances.map(a => `<tr><td>${a.Date}</td><td style="text-align:right;">${parseFloat(a.AdvanceAmount).toFixed(2)}</td></tr>`).join('')
        : '<tr><td colspan="2" style="text-align:center;">දත්ත නොමැත</td></tr>';

    return `<table class="simple-table">
                <thead><tr><th>දිනය</th><th style="text-align:right;">මුදල (Rs)</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
}

function generateOtherTableHtml(teaPackets, others) {
    let rows = '';
    if (teaPackets && teaPackets.length > 0) {
        teaPackets.forEach(tp => {
            rows += `<tr><td>${tp.Date}</td><td>තේ පැකට් (${tp.Quantity})</td><td style="text-align:right;">${parseFloat(tp.FullTotal).toFixed(2)}</td></tr>`;
        });
    }
    if (others && others.length > 0) {
        others.forEach(o => {
            rows += `<tr><td>${o.Date}</td><td>${o.Description}</td><td style="text-align:right;">${parseFloat(o.Price).toFixed(2)}</td></tr>`;
        });
    }
    if (!rows) rows = '<tr><td colspan="3" style="text-align:center;">දත්ත නොමැත</td></tr>';

    return `<table class="simple-table">
                <thead><tr><th>දිනය</th><th>විස්තරය</th><th style="text-align:right;">මුදල (Rs)</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
}

function generateFertilizerTableHtml(fertilizers) {
    let rows = fertilizers && fertilizers.length > 0
        ? fertilizers.map(f => `<tr><td>${f.Date}</td><td>${f.FertilizerType}</td><td>${f.Quantity}</td><td style="text-align:right;">${parseFloat(f.HalfPayment1).toFixed(2)}</td></tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center;">දත්ත නොමැත</td></tr>';

    return `<table class="simple-table">
                <thead><tr><th>දිනය</th><th>වර්ගය</th><th>Qty</th><th style="text-align:right;">ගෙවීම (Rs)</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
}
// ================= SEARCH CUSTOMER LOGIC =================
// ================= SEARCH CUSTOMER LOGIC =================
$('#btnSearchCustomer').on('click', async function () {
    const query = $('#txtSearchCustomer').val().trim();
    if (!query) return alert('කරුණාකර නමක් හෝ ID එකක් ඇතුළත් කරන්න!');

    try {
        const results = await window.api.customer.search(query);

        if (results && results.length > 0) {
            const customer = results[0];

            // සියලුම පිටුවල ඇති dropdown හඳුනාගැනීම
            const dropdown = $('#cmbOrderCustomerId, #cmbTeaCustomerId, #cmbSummaryCustomerID');

            if (dropdown.find(`option[value="${customer.CustomerID}"]`).length > 0) {
                dropdown.val(customer.CustomerID).trigger('change');

                // විශේෂිතව Summary පිටුවේදී ස්වයංක්‍රීයව දත්ත Load කිරීම
                if (window.location.href.includes('summary')) { // පිටුව summary නම් පමණක්
                    $('#btnLoadSummaryData').click();
                }

                showToast(`Found: ${customer.Name}`, "success");
            } else {
                alert('මෙම පාරිභෝගිකයා ලැයිස්තුවේ හමු නොවීය!');
            }
        } else {
            alert('පාරිභෝගිකයා හමු නොවීය!');
        }
    } catch (err) {
        console.error('Search error:', err);
    }
});
// Enter key එක එබූ විටත් search වීමට
$('#txtSearchCustomer').on('keypress', function (e) {
    if (e.which === 13) {
        $('#btnSearchCustomer').click();
    }
});