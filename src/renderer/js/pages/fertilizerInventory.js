// js/pages/fertilizerInventory.js
$(document).ready(async function () {
  let selectedItem = null;

  async function generateNextId() {
    try {
      console.log('Calling getNextId...');
      const result = await window.api.fertilizer.getNextId();
      console.log('getNextId result:', result);
      
      const nextId = result.success ? result.id : 'FINV001';
      console.log('Setting ID to:', nextId);
      
      $("#txtDisplayInventoryId").val(nextId);
      $("#txtInventoryId").val(nextId);
    } catch (error) {
      console.error('Load next ID error:', error);
      $("#txtDisplayInventoryId").val("FINV001");
      $("#txtInventoryId").val("FINV001");
    }
  }

  async function loadData() {
    try {
      const items = await window.api.fertilizer.getAll();
      const $tbody = $('#tblFertilizerInventory');
      $tbody.empty();
      
      if (items.length === 0) {
        $tbody.append('<tr><td colspan="6" class="text-center text-muted">No records found</td></tr>');
        return;
      }
      
      items.forEach(item => {
        $tbody.append(`
          <tr data-id="${item.FInventoryId}" style="cursor: pointer;">
            <td>${item.FInventoryId}</td>
            <td>${item.Fertilizer}</td>
            <td>${parseFloat(item.Quantity).toFixed(2)}</td>
            <td>Rs ${parseFloat(item.BuyPrice).toFixed(2)}</td>
            <td>Rs ${parseFloat(item.SellPrice).toFixed(2)}</td>
            <td>${item.Date}</td>
          </tr>
        `);
      });
    } catch (error) {
      console.error('Load data error:', error);
      showErrorToast('Failed to load inventory data');
    }
  }

  function clearForm() {
    selectedItem = null;
    $('#txtInvQuantity').val('');
    $('#txtBuyPrice').val('');
    $('#txtSellingPrice').val('');
    $('#txtInvDate').val(new Date().toISOString().split('T')[0]);
    $('input[name="fertilizerType"]').prop('checked', false);  // Fixed: matches HTML name
    generateNextId();
  }

  // Row click handler
  $('#tblFertilizerInventory').on('click', 'tr[data-id]', async function () {
    const id = $(this).data('id');
    try {
      const items = await window.api.fertilizer.getAll();
      selectedItem = items.find(i => i.FInventoryId === id);
      
      if (!selectedItem) {
        showErrorToast('Item not found');
        return;
      }

      // Highlight selected row
      $('#tblFertilizerInventory tr').removeClass('table-active');
      $(this).addClass('table-active');

      // Populate form
      $('#txtInventoryId').val(selectedItem.FInventoryId);
      $('#txtDisplayInventoryId').val(selectedItem.FInventoryId);
      $('#txtInvQuantity').val(selectedItem.Quantity);
      $('#txtBuyPrice').val(selectedItem.BuyPrice);
      $('#txtSellingPrice').val(selectedItem.SellPrice);
      $('#txtInvDate').val(selectedItem.Date);
      
      // Check the correct radio button (matches HTML radio names)
      $(`input[name="fertilizerType"][value="${selectedItem.Fertilizer}"]`).prop('checked', true);
    } catch (error) {
      console.error('Row click error:', error);
      showErrorToast('Failed to load item details');
    }
  });

  // Add button
  $('#btnInvAdd').click(async function () {
    try {
      const fertilizer = $('input[name="fertilizerType"]:checked').val();
      const quantity = $('#txtInvQuantity').val();
      const buyPrice = $('#txtBuyPrice').val();
      const sellPrice = $('#txtSellingPrice').val();
      const date = $('#txtInvDate').val();

      // Validation
      if (!fertilizer) {
        showErrorToast('Please select a fertilizer type');
        return;
      }
      if (!quantity || parseFloat(quantity) <= 0) {
        showErrorToast('Please enter a valid quantity');
        return;
      }
      if (!buyPrice || parseFloat(buyPrice) <= 0) {
        showErrorToast('Please enter a valid buy price');
        return;
      }
      if (!sellPrice || parseFloat(sellPrice) <= 0) {
        showErrorToast('Please enter a valid selling price');
        return;
      }
      if (!date) {
        showErrorToast('Please select a date');
        return;
      }

      const data = {
        Fertilizer: fertilizer,
        Quantity: parseFloat(quantity),
        BuyPrice: parseFloat(buyPrice),
        SellPrice: parseFloat(sellPrice),
        Date: date
      };

      const result = await window.api.fertilizer.add(data);
      
      if (result.success) {
        showSuccessToast('Fertilizer inventory added successfully');
        await loadData();
        clearForm();
      } else {
        showErrorToast(result.message || 'Failed to add inventory');
      }
    } catch (error) {
      console.error('Add error:', error);
      showErrorToast('Failed to add inventory');
    }
  });

  // Update button
  $('#btnInvUpdate').click(async function () {
    if (!selectedItem) {
      showErrorToast('Please select an item to update');
      return;
    }

    try {
      const fertilizer = $('input[name="fertilizerType"]:checked').val();
      const quantity = $('#txtInvQuantity').val();
      const buyPrice = $('#txtBuyPrice').val();
      const sellPrice = $('#txtSellingPrice').val();
      const date = $('#txtInvDate').val();

      // Validation
      if (!fertilizer || !quantity || !buyPrice || !sellPrice || !date) {
        showErrorToast('Please fill all required fields');
        return;
      }

      const data = {
        FInventoryId: $('#txtInventoryId').val(),
        Fertilizer: fertilizer,
        Quantity: parseFloat(quantity),
        BuyPrice: parseFloat(buyPrice),
        SellPrice: parseFloat(sellPrice),
        Date: date
      };

      const result = await window.api.fertilizer.update(data);
      
      if (result.success) {
        showSuccessToast('Inventory updated successfully');
        await loadData();
        clearForm();
      } else {
        showErrorToast(result.message || 'Failed to update inventory');
      }
    } catch (error) {
      console.error('Update error:', error);
      showErrorToast('Failed to update inventory');
    }
  });

  // Delete button
  $('#btnInvDelete').click(async function () {
    if (!selectedItem) {
      showErrorToast('Please select an item to delete');
      return;
    }

    if (!confirm(`Delete ${selectedItem.Fertilizer} inventory (ID: ${selectedItem.FInventoryId})?`)) {
      return;
    }

    try {
      const result = await window.api.fertilizer.delete(selectedItem.FInventoryId);
      
      if (result.success) {
        showSuccessToast('Inventory deleted successfully');
        await loadData();
        clearForm();
      } else {
        showErrorToast(result.message || 'Failed to delete inventory');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showErrorToast('Failed to delete inventory');
    }
  });

  // Clear button
  $('#btnInvClear').click(clearForm);

  // Set default date to today
  $('#txtInvDate').val(new Date().toISOString().split('T')[0]);

  // Initialize
  await generateNextId();
  await loadData();
});