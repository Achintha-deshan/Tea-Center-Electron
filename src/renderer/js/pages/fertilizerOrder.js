console.log("Fertilizer Order loaded");

$(document).ready(async function () {
    await loadNextId();
    await loadTransport();
    await loadFertilizerOrders();

    const today = new Date().toISOString().split('T')[0];
    $("#txtOrderDate").val(today);

    const customers = await window.api.customer.getAll();

    $("#cmbOrderCustomerId").empty();
    $("#cmbOrderCustomerId").append(`<option value="">-- Select Customer --</option>`);
    customers.forEach(cus => {
        $("#cmbOrderCustomerId").append(
            `<option value="${cus.CustomerID}" 
                data-name="${cus.Name}" 
                data-phone="${cus.Phone}" 
                data-transport="${cus.TransportRequired}">
                ${cus.CustomerID} - ${cus.Name}
            </option>`
        );
    });

    clearFields(); // Clear form on load
});

// ================= LOAD NEXT ID =================
async function loadNextId() {
    try {
        const nextid = await window.api.fertilizerOrder.getNextId();
        $("#txtDisplayOrderId").val(nextid);
        $("#txtOrderId").val(nextid);
    } catch (error) {
        console.error(error);
        $("#txtDisplayOrderId").val("---");
        $("#txtOrderId").val("");
    }
}

// ================= LOAD TRANSPORTERS =================
async function loadTransport() {
    try {
        const transport = await window.api.fertilizerOrder.getTransportEmployees();
        const cmb = $("#cmbOrderTransporterId");
        cmb.empty();
        cmb.append(`<option value="">-- Select Transporter --</option>`);

        if (!transport || transport.length === 0) return;

        transport.forEach(emp => {
            cmb.append(`<option value="${emp.EmployeeID}">${emp.EmployeeID}-${emp.Name}</option>`);
        });
    } catch (error) {
        console.error("Failed to load transporters:", error);
        showToast("Failed to load transporters", "error");
    }
}

// ================= LOAD INVENTORY BY TYPE =================
$("input[name='orderFertilizerType']").on("change", async function () {
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
$("#cmbFertilizerInventoryId").on("change", function () {
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

// Call updateTransportFee when quantity or transporter changes
$("#txtOrderQuantity, #cmbOrderTransporterId").on("input change", updateTransportFee);

// ================= ADD ORDER =================
$("#btnOrderAdd").on("click", async function () {
    try {
        const orderData = collectOrderData();
        if (!orderData) return;

        const res = await window.api.fertilizerOrder.add(orderData);
        if (res.success) {
            showToast("Order added successfully!", "success");
            await loadFertilizerOrders();
            await loadNextId();
            clearFields();
        } else {
            showToast("Failed to add order: " + res.message, "error");
        }
    } catch (error) {
        console.error(error);
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
            await loadFertilizerOrders();
            clearFields();
            await loadNextId();
        } else {
            showToast("Failed to update order: " + res.message, "error");
        }
    } catch (error) {
        console.error(error);
        showToast("Error updating order");
    }
});

// ================= DELETE ORDER =================
$("#btnOrderDelete").on("click", async function () {
    const orderId = $("#txtOrderId").val();
    if (!orderId) {
        showToast("Select an order to delete!");
        return;
    }

    const res = await window.api.fertilizerOrder.delete(orderId);
    if (res.success) {
        showToast("Order deleted successfully!", "success");
        await loadFertilizerOrders();
        await loadNextId();
        clearFields();
    } else {
        showToast("Failed to delete order: " + res.message, "error");
    }
});

// ================= COLLECT ORDER DATA =================
function collectOrderData(isUpdate = false) {
    const orderId = $("#txtOrderId").val();
    const customerId = $("#cmbOrderCustomerId").val();
    const customerName = $("#cmbOrderCustomerId option:selected").data("name");
    const fertilizerType = $("input[name='orderFertilizerType']:checked").val();
    const inventoryId = $("#cmbFertilizerInventoryId").val();
    const availableQty = Number($("#lblAvailableQty").val().replace(" kg", "")) + (isUpdate ? Number($("#txtOrderQuantity").val()) : 0);
    const orderQty = Number($("#txtOrderQuantity").val());
    const pricePerKg = Number($("#txtPricePerKg").val());
    const transporterId = $("#cmbOrderTransporterId").val();
    const date = $("#txtOrderDate").val();
    const transportFee = transporterId ? orderQty * 2 : 0;

    if (!orderId || !customerId || !fertilizerType || !inventoryId || !orderQty || !pricePerKg) {
        showToast("Please fill all required fields!");
        return null;
    }

    if (orderQty > availableQty) {
        showToast("Order quantity exceeds available stock!");
        return null;
    }

    const totalPrice = orderQty * pricePerKg;
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
            tbody.append(`
                <tr>
                    <td colspan="10" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        No orders found
                    </td>
                </tr>
            `);
            return;
        }

        orders.forEach(order => {
            tbody.append(`
                <tr data-id="${order.OrderID}">
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
        console.error("Failed to load fertilizer orders:", error);
        showToast("Failed to load orders", "error");
    }
}

// ================= TABLE ROW CLICK =================
$(document).on("click", "#tblFertilizerOrders tr[data-id]", async function () {
    const orderId = $(this).data("id");
    const orders = await window.api.fertilizerOrder.getAll();
    const order = orders.find(o => o.OrderID === orderId);
    if (!order) return;

    // Enable Update, Disable Add
    $("#btnOrderUpdate").prop("disabled", false);
    $("#btnOrderAdd").prop("disabled", true);

    // Fill Order ID
    $("#txtOrderId").val(order.OrderID);
    $("#txtDisplayOrderId").val(order.OrderID);

    // Fill Customer
    $("#cmbOrderCustomerId").val(order.CustomerID);

    // Fill Fertilizer Type
    $("input[name='orderFertilizerType'][value='" + order.FertilizerType + "']").prop("checked", true);

    // Load inventory by type
    const inventories = await window.api.fertilizerOrder.getInventoryByType(order.FertilizerType);
    const cmb = $("#cmbFertilizerInventoryId");
    cmb.empty();
    cmb.append(`<option value="">-- Select Inventory --</option>`);

    inventories.forEach(inv => {
        cmb.append(`
            <option value="${inv.FInventoryId}" data-qty="${inv.Quantity}" data-price="${inv.SellPrice}">
                ${inv.FInventoryId}
            </option>
        `);
    });

    // Select inventory
    $("#cmbFertilizerInventoryId").val(order.FInventoryID).trigger("change");

    // Fill Quantity
    $("#txtOrderQuantity").val(order.Quantity);

    // Fill Price per Kg
    const pricePerKg = (order.Quantity > 0) ? (order.Price / order.Quantity).toFixed(2) : 0;
    $("#txtPricePerKg").val(pricePerKg);

    // Fill Transporter
    $("#cmbOrderTransporterId").val(order.TransporterID);

    // Fill Date
    $("#txtOrderDate").val(order.Date);

    // Update Transport Fee
    const transportFee = order.TransporterID ? order.Quantity * 2 : 0;
    $("#lblTransportFee").text(`Transport Fee: Rs ${transportFee.toFixed(2)}`);

    // Fill Available Qty
    const availableQty = $("#cmbFertilizerInventoryId option:selected").data("qty") || 0;
    $("#lblAvailableQty").val(availableQty + " kg");
});

// ================= CLEAR FORM =================
function clearFields() {
    $("#cmbOrderCustomerId").val("");
    $("input[name='orderFertilizerType']").prop("checked", false);
    $("#cmbFertilizerInventoryId").val("");
    $("#txtOrderQuantity").val("");
    $("#txtPricePerKg").val("");
    $("#cmbOrderTransporterId").val("");
    $("#lblAvailableQty").val("0 kg");
    $("#lblTransportFee").text("Transport Fee: Rs 0.00");

    // Buttons
    $("#btnOrderUpdate").prop("disabled", true);
    $("#btnOrderAdd").prop("disabled", false);
}
