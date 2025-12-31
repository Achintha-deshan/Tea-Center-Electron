// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {

  user: {
    getAll: () => ipcRenderer.invoke('user:getAll'),
    add: (data) => ipcRenderer.invoke('user:add', data),
    update: (data) => ipcRenderer.invoke('user:update', data),
    delete: (userId) => ipcRenderer.invoke('user:delete', userId),
    login: (username, password) => ipcRenderer.invoke('user:login', { username, password })
  },

  // ==================== CUSTOMER ====================
  customer: {
    getAll: () => ipcRenderer.invoke('customer:getAll'),
    getNextId: () => ipcRenderer.invoke('customer:getNextId'),
    add: (data) => ipcRenderer.invoke('customer:add', data),
    update: (data) => ipcRenderer.invoke('customer:update', data),
    delete: (id) => ipcRenderer.invoke('customer:delete', id),
    getAllIds: () => ipcRenderer.invoke('customer:getAllIds'),
    search: (query) => ipcRenderer.invoke('customer:search', query)

  },

  // ==================== EMPLOYEE ====================
  employee: {
    getAll: () => ipcRenderer.invoke('employee:getAll'),
    getNextId: () => ipcRenderer.invoke('employee:getNextId'),
    add: (data) => ipcRenderer.invoke('employee:add', data),
    update: (data) => ipcRenderer.invoke('employee:update', data),
    delete: (id) => ipcRenderer.invoke('employee:delete', id)
  },

  // ==================== TEA FACTORY ====================
  teaFactory: {
    getAll: () => ipcRenderer.invoke('teaFactory:getAll'),
    getNextId: () => ipcRenderer.invoke('teaFactory:getNextId'),
    add: (data) => ipcRenderer.invoke('teaFactory:add', data),
    update: (data) => ipcRenderer.invoke('teaFactory:update', data),
    delete: (id) => ipcRenderer.invoke('teaFactory:delete', id)
  },

  // ==================== RAW TEA INVENTORY ====================
  rawtea: {
    getAll: () => ipcRenderer.invoke('rawtea:getAll'),
    getNextId: () => ipcRenderer.invoke('rawtea:getNextId'),
    add: (data) => ipcRenderer.invoke('rawtea:add', data),
    update: (data) => ipcRenderer.invoke('rawtea:update', data),
    delete: (id) => ipcRenderer.invoke('rawtea:delete', id),
    searchCustomer: (query) => ipcRenderer.invoke('rawtea:searchCustomer', query),
    getTransportEmployees: () => ipcRenderer.invoke('rawtea:getTransportEmployees'),
    getMonthlyData: (year, month) => ipcRenderer.invoke('rawtea:getMonthlyData', year, month)

  },

  // ==================== Monthly tea rate ====================
  Monthlyrate: {
    getNextId: () => ipcRenderer.invoke('Monthlyrate:getNextId'),
    add: (data) => ipcRenderer.invoke('Monthlyrate:add', data),
    loadByYearMonth: (year, month) =>
      ipcRenderer.invoke('Monthlyrate:loadByYearMonth', year, month),
    update: (data) => ipcRenderer.invoke('Monthlyrate:update', data)
  },

  // ==================== FERTILIZER INVENTORY ====================
  fertilizer: {
    getAll: () => ipcRenderer.invoke('fertilizer:getAll'),
    getNextId: () => ipcRenderer.invoke('fertilizer:getNextId'),
    add: data => ipcRenderer.invoke('fertilizer:add', data),
    update: data => ipcRenderer.invoke('fertilizer:update', data),
    delete: id => ipcRenderer.invoke('fertilizer:delete', id),
  },


  // ==================== FERTILIZER ORDER  ====================
  fertilizerOrder: {
    getAll: () => ipcRenderer.invoke('fertilizerOrder:getAll'),
    getNextId: () => ipcRenderer.invoke('fertilizerOrder:getNextId'),
    add: (data) => ipcRenderer.invoke('fertilizerOrder:add', data),
    update: (data) => ipcRenderer.invoke('fertilizerOrder:update', data),
    delete: (id) => ipcRenderer.invoke('fertilizerOrder:delete', id),

    getInventoryByType: (type) =>
      ipcRenderer.invoke('fertilizerOrder:getInventoryByType', type),

    getInventoryDetails: (id) =>
      ipcRenderer.invoke('fertilizerOrder:getInventoryDetails', id),

    getCustomerName: (id) =>
      ipcRenderer.invoke('fertilizerOrder:getCustomerName', id),

    searchCustomer: (query) =>
      ipcRenderer.invoke('fertilizerOrder:searchCustomer', query),

    getTransportEmployees: () =>
      ipcRenderer.invoke('fertilizerOrder:getTransportEmployees'),
  },


  // ==================== TEA PACKET INVENTORY ====================
  teaInventory: {
    getNextId: () => ipcRenderer.invoke('teaPacketInventory:getNextId'),
    getAll: () => ipcRenderer.invoke('teaPacketInventory:getAll'),
    add: (data) => ipcRenderer.invoke('teaPacketInventory:add', data),
    update: (data) => ipcRenderer.invoke('teaPacketInventory:update', data),
    delete: (id) => ipcRenderer.invoke('teaPacketInventory:delete', id),

    // ✅ මේ line එක අලුතින් add කරන්න!
    updateQuantity: (inventoryId, quantityChange) =>
      ipcRenderer.invoke('teaPacketInventory:updateQuantity', inventoryId, quantityChange)
  },
  teaOrder: {
    getNextId: () => ipcRenderer.invoke('teaPacketOrder:getNextId'),
    getAll: () => ipcRenderer.invoke('teaPacketOrder:getAll'),
    add: (data) => ipcRenderer.invoke('teaPacketOrder:add', data),
    update: (data) => ipcRenderer.invoke('teaPacketOrder:update', data),
    delete: (id) => ipcRenderer.invoke('teaPacketOrder:delete', id)
  },
  advance: {
    getAll: () => ipcRenderer.invoke('advance:getAll'),
    getNextId: () => ipcRenderer.invoke('advance:getNextId'),
    add: (data) => ipcRenderer.invoke('advance:add', data),
    update: (data) => ipcRenderer.invoke('advance:update', data),
    delete: (advanceId) =>
      ipcRenderer.invoke('advance:delete', advanceId),
    getByCustomer: (customerId) =>
      ipcRenderer.invoke('advance:getByCustomer', customerId),
  },
  otherAdd: {
    getAll: () => ipcRenderer.invoke('otherAdd:getAll'),
    getNextId: () => ipcRenderer.invoke('otherAdd:getNextId'),
    add: (data) => ipcRenderer.invoke('otherAdd:add', data),
    update: (data) => ipcRenderer.invoke('otherAdd:update', data),
    delete: (otherId) =>
      ipcRenderer.invoke('otherAdd:delete', otherId),
    getByCustomer: (customerId) =>
      ipcRenderer.invoke('otherAdd:getByCustomer', customerId),
  },
  summary: {
    load: (data) => ipcRenderer.invoke('summary:load', data),
    getNextId: () => ipcRenderer.invoke('summary:getNextId'),
    calculate: (data) => ipcRenderer.invoke('summary:calculate', data)
  },
  report: {
    generateCustomerSummary: (data) => ipcRenderer.invoke('report:generateCustomerSummary', data),
    generateAllCustomerSummaries: (year, month) => ipcRenderer.invoke('report:generateAllCustomerSummaries', { year, month }),
    previewAndSave: (data) => ipcRenderer.invoke('report:previewAndSave', data)
  }

});

console.log('✅ Preload API bridge ready – secure & stable!');