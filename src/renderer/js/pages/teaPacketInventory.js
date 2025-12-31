$(document).ready(async function () {
  let selectedItem = null;

  async function generateNextId() {
    const nextId = await window.api.teaInventory.getNextId();
    $('#txtTeaInventoryId').val(nextId);
    $('#txtDisplayTeaInventoryId').val(nextId);
  }

  async function loadData() {
    const items = await window.api.teaInventory.getAll();
    const $tbody = $('#tblTeaInventory');
    $tbody.empty();
    if (items.length === 0) {
      $tbody.append('<tr><td colspan="7" class="text-center">No records</td></tr>');
      return;
    }
    items.forEach(item => {
      $tbody.append(`
        <tr data-id="${item.TPinventoryId}">
          <td>${item.TPinventoryId}</td>
          <td>${item.TeaType}</td>
          <td>${item.TeaPacket}</td>
          <td>${item.TeaPacketQTY}</td>
          <td>${item.BuyPrice}</td>
          <td>${item.SellPrice}</td>
          <td>${item.Date}</td>
        </tr>
      `);
    });
  }

  function clearForm() {
    selectedItem = null;
    $('#txtTeaType').val('');
    $('#cmbTeaPacketSize').val('');
    $('#txtTeaPacketQty').val('');
    $('#txtTeaBuyPrice').val('');
    $('#txtTeaSellPrice').val('');
    $('#txtTeaDate').val(new Date().toISOString().split('T')[0]);
    generateNextId();
  }

  $('#tblTeaInventory').on('click', 'tr', async function () {
    const id = $(this).data('id');
    const items = await window.api.teaInventory.getAll();
    selectedItem = items.find(i => i.TPinventoryId === id);
    if (!selectedItem) return;

    $('#txtTeaInventoryId').val(selectedItem.TPinventoryId);
    $('#txtDisplayTeaInventoryId').val(selectedItem.TPinventoryId);
    $('#txtTeaType').val(selectedItem.TeaType);
    $('#cmbTeaPacketSize').val(selectedItem.TeaPacket);
    $('#txtTeaPacketQty').val(selectedItem.TeaPacketQTY);
    $('#txtTeaBuyPrice').val(selectedItem.BuyPrice);
    $('#txtTeaSellPrice').val(selectedItem.SellPrice);
    $('#txtTeaDate').val(selectedItem.Date);
  });

  $('#btnAddTeaInventory').click(async function () {
    const data = {
      TeaType: $('#txtTeaType').val(),
      TeaPacket: $('#cmbTeaPacketSize').val(),
      TeaPacketQTY: Number($('#txtTeaPacketQty').val()),
      BuyPrice: Number($('#txtTeaBuyPrice').val()),
      SellPrice: Number($('#txtTeaSellPrice').val()),
      Date: $('#txtTeaDate').val()
    };
    await window.api.teaInventory.add(data);
    await loadData();
    clearForm();
  });

  $('#btnUpdateTeaInventory').click(async function () {
    if (!selectedItem) return alert('Select item first');
    const data = {
      TPinventoryId: $('#txtTeaInventoryId').val(),
      TeaType: $('#txtTeaType').val(),
      TeaPacket: $('#cmbTeaPacketSize').val(),
      TeaPacketQTY: Number($('#txtTeaPacketQty').val()),
      BuyPrice: Number($('#txtTeaBuyPrice').val()),
      SellPrice: Number($('#txtTeaSellPrice').val()),
      Date: $('#txtTeaDate').val()
    };
    await window.api.teaInventory.update(data);
    await loadData();
    clearForm();
  });

  $('#btnDeleteTeaInventory').click(async function () {
    if (!selectedItem) return alert('Select item first');
    await window.api.teaInventory.delete(selectedItem.TPinventoryId);
    await loadData();
    clearForm();
  });

  $('#btnClearTeaInventory').click(clearForm);

  generateNextId();
  loadData();
});
