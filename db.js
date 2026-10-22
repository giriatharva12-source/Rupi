/**
 * Rupantar Store — Persistent Database Storage
 *
 * Safe, atomic file-backed JSON store for orders, addresses, payment status,
 * and fulfilment tracking. Zero external database daemon needed.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "orders.json");
const TMP_FILE = path.join(DATA_DIR, "orders.tmp.json");

// Ensure data directory and file exist
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      orders: [],
      meta: {
        createdAt: new Date().toISOString(),
        version: "1.0.0"
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

// Read all orders
function readData() {
  initDB();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file:", err);
    return { orders: [], meta: {} };
  }
}

// Atomic write to database file
function writeData(data) {
  initDB();
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(TMP_FILE, DB_FILE);
    return true;
  } catch (err) {
    console.error("Error writing to database:", err);
    try {
      if (fs.existsSync(TMP_FILE)) fs.unlinkSync(TMP_FILE);
    } catch (_) {}
    return false;
  }
}

// Generate unique, readable order ID (e.g., RUP-20261022-8391)
function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RUP-${dateStr}-${randomSuffix}`;
}

// Create a new order
function createOrder(orderPayload) {
  const data = readData();
  const orderId = orderPayload.id || generateOrderId();

  const newOrder = {
    id: orderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: {
      name: orderPayload.customer.name,
      phone: orderPayload.customer.phone,
      email: orderPayload.customer.email || null,
      address: {
        house: orderPayload.customer.address.house,
        street: orderPayload.customer.address.street,
        landmark: orderPayload.customer.address.landmark || "",
        city: orderPayload.customer.address.city,
        state: orderPayload.customer.address.state,
        pincode: orderPayload.customer.address.pincode
      },
      deliveryInstructions: orderPayload.customer.deliveryInstructions || ""
    },
    items: orderPayload.items || [],
    pricing: {
      subtotal: orderPayload.pricing.subtotal,
      discount: orderPayload.pricing.discount || 0,
      deliveryFee: orderPayload.pricing.deliveryFee || 0,
      total: orderPayload.pricing.total,
      currency: "INR"
    },
    paymentMethod: orderPayload.paymentMethod, // 'UPI' | 'CARD' | 'NETBANKING' | 'COD' | 'WHATSAPP'
    paymentStatus: orderPayload.paymentStatus || (orderPayload.paymentMethod === "COD" ? "UNPAID / COD" : "PENDING"),
    orderStatus: orderPayload.orderStatus || "PLACED", // 'PLACED' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'
    gateway: orderPayload.gateway || {
      provider: "razorpay",
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpaySignature: null,
      paidAt: null
    },
    statusHistory: [
      {
        status: orderPayload.orderStatus || "PLACED",
        timestamp: new Date().toISOString(),
        note:
          orderPayload.paymentMethod === "COD"
            ? "Order placed with Cash on Delivery"
            : "Order initiated awaiting online payment"
      }
    ]
  };

  data.orders.unshift(newOrder);
  writeData(data);
  return newOrder;
}

// Get order by ID
function getOrderById(orderId) {
  const data = readData();
  return data.orders.find(o => o.id === orderId) || null;
}

// Find order by Razorpay Order ID
function getOrderByRazorpayOrderId(rzpOrderId) {
  const data = readData();
  return data.orders.find(o => o.gateway && o.gateway.razorpayOrderId === rzpOrderId) || null;
}

// Update order
function updateOrder(orderId, updates) {
  const data = readData();
  const index = data.orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const existing = data.orders[index];
  const updated = {
    ...existing,
    ...updates,
    gateway: {
      ...existing.gateway,
      ...(updates.gateway || {})
    },
    updatedAt: new Date().toISOString()
  };

  if (updates.orderStatus && updates.orderStatus !== existing.orderStatus) {
    updated.statusHistory = updated.statusHistory || [];
    updated.statusHistory.push({
      status: updates.orderStatus,
      timestamp: new Date().toISOString(),
      note: updates.statusNote || `Status changed to ${updates.orderStatus}`
    });
  }

  if (updates.paymentStatus && updates.paymentStatus !== existing.paymentStatus) {
    updated.statusHistory = updated.statusHistory || [];
    updated.statusHistory.push({
      status: `PAYMENT_${updates.paymentStatus}`,
      timestamp: new Date().toISOString(),
      note: updates.paymentNote || `Payment status updated to ${updates.paymentStatus}`
    });
  }

  data.orders[index] = updated;
  writeData(data);
  return updated;
}

// List all orders with optional filtering
function listOrders(filter = {}) {
  const data = readData();
  let result = [...data.orders];

  if (filter.paymentStatus) {
    result = result.filter(o => o.paymentStatus.toLowerCase().includes(filter.paymentStatus.toLowerCase()));
  }
  if (filter.orderStatus) {
    result = result.filter(o => o.orderStatus.toLowerCase() === filter.orderStatus.toLowerCase());
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      o =>
        o.id.toLowerCase().includes(q) ||
        (o.customer.name && o.customer.name.toLowerCase().includes(q)) ||
        (o.customer.phone && o.customer.phone.includes(q)) ||
        (o.customer.address.city && o.customer.address.city.toLowerCase().includes(q))
    );
  }

  return result;
}

// Get high-level stats for admin dashboard
function getStats() {
  const data = readData();
  const totalOrders = data.orders.length;
  let totalRevenue = 0;
  let paidCount = 0;
  let codPendingCount = 0;
  let processingCount = 0;
  let dispatchedCount = 0;
  let deliveredCount = 0;

  for (const o of data.orders) {
    if (o.paymentStatus === "PAID" || o.paymentStatus === "PAID (COD Collected)") {
      totalRevenue += o.pricing.total || 0;
      paidCount++;
    } else if (o.paymentMethod === "COD" && o.orderStatus !== "CANCELLED") {
      codPendingCount++;
    }

    if (o.orderStatus === "PROCESSING") processingCount++;
    if (o.orderStatus === "DISPATCHED") dispatchedCount++;
    if (o.orderStatus === "DELIVERED") deliveredCount++;
  }

  return {
    totalOrders,
    totalRevenue,
    paidCount,
    codPendingCount,
    processingCount,
    dispatchedCount,
    deliveredCount
  };
}

module.exports = {
  initDB,
  createOrder,
  getOrderById,
  getOrderByRazorpayOrderId,
  updateOrder,
  listOrders,
  getStats,
  generateOrderId
};
