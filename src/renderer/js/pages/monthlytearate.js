let currentMonthlyData = [];

$(document).ready(async function () {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const cmbYear = document.getElementById('cmbYear');
  const cmbMonth = document.getElementById('cmbMonth');

  for (let y = 2020; y <= 2030; y++) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    cmbYear.appendChild(opt);
  }

  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    if (m === currentMonth) opt.selected = true;
    cmbMonth.appendChild(opt);
  }

  await loadNextId();

  const today = new Date().toISOString().split('T')[0];
  $("#txtDate").val(today);

  document.getElementById('tblPayments').innerHTML =
    `<tr><td colspan="6" class="text-center text-muted">Click "Load Data" to begin</td></tr>`;
});

// ==================== LOAD NEXT ID ====================
async function loadNextId() {
  try {
    const nextId = await window.api.Monthlyrate.getNextId();
    $("#txtDisplaytxtmonthlytearateID").val(nextId);
    $("#txtmonthlytearateID").val(nextId);
    console.log("Next ID Set:", nextId);
  } catch (error) {
    console.error('Load next ID error:', error);
    $("#txtDisplaytxtmonthlytearateID").val("---");
  }
}

// ==================== LOAD DATA ====================
async function loadMonthlyRawTea() {
  const year = parseInt(document.getElementById('cmbYear').value);
  const month = parseInt(document.getElementById('cmbMonth').value);

  try {
    const result = await window.api.Monthlyrate.loadByYearMonth(year, month);

    if (!result || !result.data || result.data.length === 0) {
      document.getElementById('tblPayments').innerHTML =
        `<tr><td colspan="6" class="text-center">No records found for ${year}-${String(month).padStart(2, '0')}</td></tr>`;
      currentMonthlyData = [];
      $('#btnUpdate').prop('disabled', true);
      updateSummaryLabels(0, 0, 0); // Reset summary
      return;
    }

    currentMonthlyData = result.data;

    if (result.source === 'PAYMENT') {
      displayCalculatedData(result.data);
      $('#btnUpdate').prop('disabled', false);
      showToast('Loaded saved payments', 'success');
      // Saved data load වුණාම row එකක් select කරනකම් ID එක Clear කරමු
      $("#txtDisplaytxtmonthlytearateID").val("---");
      $("#txtmonthlytearateID").val("");
    } else {
      displayRawData(result.data);
      $('#btnUpdate').prop('disabled', true);
      showToast('Raw data loaded – enter rates and Calculate', 'info');
      await loadNextId(); // අලුත් calculations සඳහා ID එක ගමු
    }

  } catch (err) {
    console.error('Load error:', err);
    showToast('Failed to load data', 'error');
  }
}

// ==================== DISPLAY & SUMMARY ====================
function updateSummaryLabels(best, normal, total) {
  $('#lblTotalBest').text(`Total Best: ${best.toFixed(2)} kg`);
  $('#lblTotalNormal').text(`Total Normal: ${normal.toFixed(2)} kg`);
  $('#lblTotalAmount').text(`Total Amount: Rs ${total.toFixed(2)}`);
}

function displayRawData(data) {
  let tBest = 0, tNormal = 0;
  const tbl = document.getElementById('tblPayments');
  tbl.innerHTML = '';
  data.forEach(row => {
    tBest += row.BestTeaKg;
    tNormal += row.NormalTeaKg;
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
            <td>${row.CustomerID}</td>
            <td>${row.BestTeaKg.toFixed(2)}</td>
            <td>${row.NormalTeaKg.toFixed(2)}</td>
            <td colspan="3" class="text-muted text-center">Not calculated</td>
        `;
    tbl.appendChild(tr);
  });
  updateSummaryLabels(tBest, tNormal, 0);
}

function displayCalculatedData(data) {
  let tBest = 0, tNormal = 0, tTotal = 0;
  const tbl = document.getElementById('tblPayments');
  tbl.innerHTML = '';
  data.forEach(row => {
    tBest += row.BestTeaKg;
    tNormal += row.NormalTeaKg;
    tTotal += row.FullTotal;
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
            <td>${row.CustomerID}</td>
            <td>${row.BestTeaKg.toFixed(2)}</td>
            <td>${row.NormalTeaKg.toFixed(2)}</td>
            <td>Rs ${row.BestTeaPrice.toFixed(2)}</td>
            <td>Rs ${row.NormalTeaPrice.toFixed(2)}</td>
            <td><strong>Rs ${row.FullTotal.toFixed(2)}</strong></td>
        `;
    tbl.appendChild(tr);
  });
  updateSummaryLabels(tBest, tNormal, tTotal);
}

// ==================== ROW SELECT ====================
$(document).on('click', '#tblPayments tr', async function () {
  const index = $(this).index();
  if (index < 0 || currentMonthlyData.length === 0) return;

  const row = currentMonthlyData[index];
  if (!row || row.CustomerID === undefined) return;

  $(this).addClass('table-primary').siblings().removeClass('table-primary');
  $("#txtSelectedIndex").val(index);

  if (row.PaymentID) {
    $("#txtmonthlytearateID").val(row.PaymentID);
    $("#txtDisplaytxtmonthlytearateID").val(row.PaymentID);
  } else {
    await loadNextId();
  }

  $("#txtBestTeaRate").val(row.BestTeaRate || '');
  $("#txtNormalTeaRate").val(row.NormalTeaRate || '');
  $("#txtDate").val(row.Date || new Date().toISOString().split('T')[0]);
});

// ==================== BUTTONS ====================
$(document).on('click', '#btnLoad', () => loadMonthlyRawTea());

$(document).on('click', '#btnCalculate', async function () {
  const bestRate = parseFloat($('#txtBestTeaRate').val()) || 0;
  const normalRate = parseFloat($('#txtNormalTeaRate').val()) || 0;

  if (bestRate <= 0 && normalRate <= 0) return showToast('Enter at least one rate', 'warning');
  if (currentMonthlyData.length === 0) return showToast('Load data first', 'warning');

  const year = parseInt(document.getElementById('cmbYear').value);
  const month = parseInt(document.getElementById('cmbMonth').value);
  const date = $('#txtDate').val();

  const calculations = currentMonthlyData.map(row => ({
    CustomerID: row.CustomerID,
    Year: year,
    Month: month,
    Date: date,
    BestTeaKg: row.BestTeaKg,
    NormalTeaKg: row.NormalTeaKg,
    BestTeaRate: bestRate,
    NormalTeaRate: normalRate,
    BestTeaPrice: row.BestTeaKg * bestRate,
    NormalTeaPrice: row.NormalTeaKg * normalRate,
    FullTotal: (row.BestTeaKg * bestRate) + (row.NormalTeaKg * normalRate)
  }));

  let success = 0, failed = 0;
  for (const calc of calculations) {
    const res = await window.api.Monthlyrate.add(calc);
    res.success ? success++ : failed++;
  }

  displayCalculatedData(calculations);
  currentMonthlyData = calculations;
  $('#btnUpdate').prop('disabled', false);
  await loadNextId();

  showToast(failed === 0 ? `${success} payments saved!` : `Error: ${failed} failed`, failed === 0 ? 'success' : 'error');
});

$(document).on('click', '#btnUpdate', async function () {
  const index = parseInt($("#txtSelectedIndex").val());
  const paymentId = $("#txtmonthlytearateID").val();

  if (isNaN(index) || !paymentId) return showToast('Select a saved row to update', 'warning');

  const row = currentMonthlyData[index];
  const bestRate = parseFloat($("#txtBestTeaRate").val()) || 0;
  const normalRate = parseFloat($("#txtNormalTeaRate").val()) || 0;

  const updated = {
    PaymentID: paymentId,
    CustomerID: row.CustomerID,
    Date: $("#txtDate").val(),
    BestTeaRate: bestRate,
    NormalTeaRate: normalRate,
    BestTeaPrice: row.BestTeaKg * bestRate,
    NormalTeaPrice: row.NormalTeaKg * normalRate,
    FullTotal: (row.BestTeaKg * bestRate) + (row.NormalTeaKg * normalRate)
  };

  const res = await window.api.Monthlyrate.update({ ...row, ...updated });
  if (res.success) {
    currentMonthlyData[index] = { ...row, ...updated };
    displayCalculatedData(currentMonthlyData);
    showToast('Updated successfully', 'success');
    await loadNextId();
  }
});

$(document).on('click', '#btnClear', function () {
  loadNextId();
  $('#txtBestTeaRate, #txtNormalTeaRate').val('');
  $('#txtDate').val(new Date().toISOString().split('T')[0]);
  $('#tblPayments tr').removeClass('table-primary');
  $("#txtSelectedIndex").val('');
  showToast('Form cleared', 'info');
});