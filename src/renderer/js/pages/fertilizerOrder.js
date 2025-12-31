console.log("Fertilizer Order loaded");

// Global variable to store all customers
let allCustomers = [];

$(document).ready(async function () {
    await refreshFertilizerPage();

    const today = new Date().toISOString().split('T')[0];
    $("#txtOrderDate").val(today);

    // Enter key support for search box
    $(document).on('keypress', '#txtSearchCustomer', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            $('#btnSearchCustomer').click();
        }
    });
});

// ================= REFRESH PAGE DATA =================
async function refreshFertilizerPage() {
    await loadNextId();
    await loadTransport();
    await loadFertilizerOrders();

    console.log("🔍 Loading customers...");
    allCustomers = await window.api.customer.getAll();
    console.log("✅ Customers loaded:", allCustomers.length);

    loadCustomerDropdown(allCustomers);
    setupSearchHandlers();
    clearFields();
}

// ================= SETUP SEARCH HANDLERS =================
function setupSearchHandlers() {
    console.log("🔧 Search handlers initializing...");

    // කලින් තිබූ event ඉවත් කර අලුතින්ම සක්‍රීය කිරීම
    $(document).off('click', '#btnSearchCustomer').on('click', '#btnSearchCustomer', function (e) {
        e.preventDefault();

        // jQuery වෙනුවට සෘජුවම Browser එකෙන් අගය ලබා ගැනීම
        const searchInput = document.getElementById('txtSearchCustomer');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

        console.log("🔍 Final Search Check. Input Value:", query);

        if (query === "") {
            showToast("කරුණාකර නමක් හෝ ID එකක් ඇතුළත් කරන්න!", "warning");
            return;
        }

        // පාරිභෝගිකයින් සිටීදැයි බැලීම (allCustomers array එක හිස්දැයි පරීක්ෂාව)
        if (!allCustomers || allCustomers.length === 0) {
            console.error("❌ Customer list is empty!");
            showToast("පාරිභෝගික දත්ත පද්ධතියේ නැත!", "error");
            return;
        }

        const found = allCustomers.find(c =>
            (c.CustomerID && String(c.CustomerID).toLowerCase() === query) ||
            (c.Name && String(c.Name).toLowerCase().includes(query))
        );

        if (found) {
            console.log("✅ Match found:", found.Name);

            // Dropdown එකේ අගය select කිරීම
            $("#cmbOrderCustomerId").val(found.CustomerID).trigger('change');

            // සෙවුම් කොටුව පිරිසිදු කිරීම
            searchInput.value = "";
            showToast(`සොයාගත්තා: ${found.Name}`, "success");
        } else {
            console.log("❌ No match found in the list.");
            showToast("පාරිභෝගිකයා හමු නොවීය!", "error");
        }
    });
}

// ================= LOAD CUSTOMER DROPDOWN =================
function loadCustomerDropdown(customers) {
    const cmb = $("#cmbOrderCustomerId");
    cmb.empty();
    cmb.append(`<option value="">-- Select Customer --</option>`);

    customers.forEach(cus => {
        cmb.append(
            `<option value="${cus.CustomerID}" 
                data-name="${cus.Name}" 
                data-phone="${cus.Phone}" 
                data-transport="${cus.TransportRequired}">
                ${cus.CustomerID} - ${cus.Name}
            </option>`
        );
    });
}

// ================= LOAD NEXT ID =================
async function loadNextId() {
    try {
        const nextid = await window.api.fertilizerOrder.getNextId();
        $("#txtDisplayOrderId").val(nextid);
        $("#txtOrderId").val(nextid);
    } catch (error) {
        console.error(error);
        $("#txtDisplayOrderId").val("---");
    }
}

// ================= LOAD TRANSPORTERS =================
async function loadTransport() {
    try {
        const transport = await window.api.fertilizerOrder.getTransportEmployees();
        const cmb = $("#cmbOrderTransporterId");
        cmb.empty();
        cmb.append(`<option value="">-- Select Transporter --</option>`);

        if (transport) {
            transport.forEach(emp => {
                cmb.append(`<option value="${emp.EmployeeID}">${emp.EmployeeID}-${emp.Name}</option>`);
            });
        }
    } catch (error) {
        console.error("Failed to load transporters:", error);
    }
}

// ================= LOAD INVENTORY BY TYPE =================
$(document).on("change", "input[name='orderFertilizerType']", async function () {
    const type = $(this).val();
    const inventories = await window.api.fertilizerOrder.getInventoryByType(type);

    const cmb = $("#cmbFertilizerInventoryId");
    cmb.empty();
    cmb.append(`<option value="">-- Select Inventory --</option>`);

    if (!inventories || inventories.length === 0) {
        $("#lblAvailableQty").val("0 kg");
        $("#txtPricePerKg").val("");
        return;
    }

    inventories.forEach(inv => {
        cmb.append(`
            <option value="${inv.FInventoryId}" data-qty="${inv.Quantity}" data-price="${inv.SellPrice}">
                ${inv.FInventoryId}
            </option>
        `);
    });
});

// ================= INVENTORY CHANGE =================
$(document).on("change", "#cmbFertilizerInventoryId", function () {
    const selected = $(this).find("option:selected");
    const qty = selected.data("qty");
    const price = selected.data("price");

    $("#lblAvailableQty").val(qty ? qty + " kg" : "0 kg");
    $("#txtPricePerKg").val(price || "");
    updateTransportFee();
});

// ================= UPDATE TRANSPORT FEE =================
function updateTransportFee() {
    const transporterId = $("#cmbOrderTransporterId").val();
    const orderQty = Number($("#txtOrderQuantity").val()) || 0;
    const transportFee = transporterId ? orderQty * 2 : 0;
    $("#lblTransportFee").text(`Transport Fee: Rs ${transportFee.toFixed(2)}`);
}

$(document).on("input change", "#txtOrderQuantity, #cmbOrderTransporterId", updateTransportFee);

// ================= ADD ORDER =================
$("#btnOrderAdd").on("click", async function () {
    try {
        const orderData = collectOrderData();
        if (!orderData) return;

        const res = await window.api.fertilizerOrder.add(orderData);
        if (res.success) {
            showToast("Order added successfully!", "success");
            await refreshFertilizerPage();
        } else {
            showToast("Failed: " + res.message, "error");
        }
    } catch (error) {
        showToast("Error processing order");
    }
});

// ================= UPDATE ORDER =================
$("#btnOrderUpdate").on("click", async function () {
    try {
        const orderData = collectOrderData(true);
        if (!orderData) return;

        const res = await window.api.fertilizerOrder.update(orderData);
        if (res.success) {
            showToast("Order updated successfully!", "success");
            await refreshFertilizerPage();
        }
    } catch (error) {
        showToast("Error updating order");
    }
});

// ================= DELETE ORDER =================
$("#btnOrderDelete").on("click", async function () {
    const orderId = $("#txtOrderId").val();
    if (!orderId) return showToast("Select an order!");

    const res = await window.api.fertilizerOrder.delete(orderId);
    if (res.success) {
        showToast("Order deleted!", "success");
        await refreshFertilizerPage();
    }
});

// ================= COLLECT ORDER DATA =================
function collectOrderData(isUpdate = false) {
    const orderId = $("#txtOrderId").val();
    const customerId = $("#cmbOrderCustomerId").val();
    const customerName = $("#cmbOrderCustomerId option:selected").data("name");
    const fertilizerType = $("input[name='orderFertilizerType']:checked").val();
    const inventoryId = $("#cmbFertilizerInventoryId").val();
    const availableQtyStr = $("#lblAvailableQty").val() || "0";
    const availableQty = Number(availableQtyStr.replace(" kg", ""));
    const orderQty = Number($("#txtOrderQuantity").val());
    const pricePerKg = Number($("#txtPricePerKg").val());
    const transporterId = $("#cmbOrderTransporterId").val();
    const date = $("#txtOrderDate").val();

    if (!orderId || !customerId || !fertilizerType || !inventoryId || !orderQty || !pricePerKg) {
        showToast("Please fill all required fields!", "warning");
        return null;
    }

    const totalPrice = orderQty * pricePerKg;
    const transportFee = transporterId ? orderQty * 2 : 0;
    const halfPayment1 = orderQty > 20 ? Math.floor(totalPrice / 2) : totalPrice;
    const halfPayment2 = orderQty > 20 ? totalPrice - halfPayment1 : 0;

    return {
        OrderID: orderId,
        CustomerID: customerId,
        CustomerName: customerName,
        FInventoryID: inventoryId,
        FertilizerType: fertilizerType,
        Quantity: orderQty,
        Price: totalPrice,
        TransporterID: transporterId,
        TransportFee: transportFee,
        Date: date,
        HalfPayment1: halfPayment1,
        HalfPayment2: halfPayment2
    };
}

// ================= LOAD ORDERS TABLE =================
async function loadFertilizerOrders() {
    try {
        const orders = await window.api.fertilizerOrder.getAll();
        const tbody = $("#tblFertilizerOrders");
        tbody.empty();

        if (!orders || orders.length === 0) {
            tbody.append('<tr><td colspan="10" class="text-center">No orders found</td></tr>');
            return;
        }

        orders.forEach(order => {
            tbody.append(`
                <tr data-id="${order.OrderID}" style="cursor:pointer">
                    <td>${order.OrderID}</td>
                    <td>${order.CustomerName || '-'}</td>
                    <td>${order.FertilizerType}</td>
                    <td>${order.FInventoryID}</td>
                    <td>${order.Quantity}</td>
                    <td>${order.Price}</td>
                    <td>${order.Date}</td>
                    <td>${order.HalfPayment1}</td>
                    <td>${order.HalfPayment2}</td>
                    <td>${order.TransporterID || '-'}</td>
                </tr>
            `);
        });
    } catch (error) {
        console.error("Load table error:", error);
    }
}

// ================= TABLE ROW CLICK =================
$(document).on("click", "#tblFertilizerOrders tr[data-id]", async function () {
    const orderId = $(this).data("id");
    const orders = await window.api.fertilizerOrder.getAll();
    const order = orders.find(o => o.OrderID === orderId);
    if (!order) return;

    $("#btnOrderUpdate").prop("disabled", false);
    $("#btnOrderAdd").prop("disabled", true);

    $("#txtOrderId").val(order.OrderID);
    $("#txtDisplayOrderId").val(order.OrderID);
    $("#cmbOrderCustomerId").val(order.CustomerID);
    $("input[name='orderFertilizerType'][value='" + order.FertilizerType + "']").prop("checked", true).trigger('change');

    // Wait for inventory dropdown to load
    setTimeout(() => {
        $("#cmbFertilizerInventoryId").val(order.FInventoryID).trigger("change");
        $("#txtOrderQuantity").val(order.Quantity);
        $("#cmbOrderTransporterId").val(order.TransporterID).trigger('change');
        $("#txtOrderDate").val(order.Date);
    }, 500);
});

// ================= CLEAR FORM =================
function clearFields() {
    $("#cmbOrderCustomerId").val("");
    $("input[name='orderFertilizerType']").prop("checked", false);
    $("#cmbFertilizerInventoryId").empty().append('<option value="">-- Select Inventory --</option>');
    $("#txtOrderQuantity").val("");
    $("#txtPricePerKg").val("");
    $("#cmbOrderTransporterId").val("");
    $("#lblAvailableQty").val("0 kg");
    $("#lblTransportFee").text("Transport Fee: Rs 0.00");
    $("#btnOrderUpdate").prop("disabled", true);
    $("#btnOrderAdd").prop("disabled", false);
    $("#txtSearchCustomer").val("");
}