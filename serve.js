/**
 * Rupantar Store — Server & Payment Gateway Engine
 *
 * Supports:
 * - Static file serving with MIME types and caching
 * - Razorpay order generation & HMAC-SHA256 signature verification
 * - Webhook processing with idempotency
 * - Cash on Delivery (COD) order management
 * - Customer validation (10-digit Indian mobile, 6-digit PIN code)
 * - Server-side trusted pricing (tamper-proof)
 * - Persistent JSON database storage (db.js)
 * - Admin order management APIs
 */

require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const db = require("./db");
const catalogue = require("./catalogue");

const PORT = process.env.PORT || 3000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "rupantar_admin_2026";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

// Initialize Razorpay client if credentials exist
let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
  });
  console.log("✓ Razorpay Payment Gateway initialized (Key ID: " + RAZORPAY_KEY_ID.slice(0, 8) + "...)");
} else {
  console.log(
    "ℹ Razorpay credentials not configured. Online payments will show configuration guide, COD is fully active."
  );
}

// Ensure DB is initialized
db.initDB();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp"
};

// Helper to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-razorpay-signature",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS"
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        // 1MB limit
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

// Read raw body for webhook verification
function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk.toString();
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

// Validate Indian Mobile & PIN Code formats
function validateCustomerDetails(customer) {
  if (!customer) return "Customer details are required";
  if (!customer.name || customer.name.trim().length < 2) return "Please enter your full name";

  let phoneClean = String(customer.phone || "").replace(/\D/g, "");
  if (phoneClean.length === 12 && phoneClean.startsWith("91")) {
    phoneClean = phoneClean.slice(2);
  } else if (phoneClean.length === 11 && phoneClean.startsWith("0")) {
    phoneClean = phoneClean.slice(1);
  }
  customer.phone = phoneClean;

  // Indian mobile: 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(phoneClean)) {
    return "Please enter a valid 10-digit Indian mobile number (e.g., 9876543210)";
  }

  const addr = customer.address || {};
  if (!addr.house || addr.house.trim().length === 0) return "Please enter your house/building/flat details";
  if (!addr.street || addr.street.trim().length === 0) return "Please enter your street/road/area";
  if (!addr.city || addr.city.trim().length === 0) return "Please enter your city";
  if (!addr.state || addr.state.trim().length === 0) return "Please select your state";

  const pincodeClean = String(addr.pincode || "").replace(/\D/g, "");
  // Indian PIN code: 6 digits, non-zero first digit
  if (!/^[1-9]\d{5}$/.test(pincodeClean)) {
    return "Please enter a valid 6-digit Indian PIN code (e.g., 560001)";
  }

  return null;
}

// Calculate tamper-proof pricing strictly on server
function calculateServerPricing(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }

  const validatedItems = [];
  let subtotal = 0;
  let totalDiaries = 0;

  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) continue;

    const sizeKey = item.size === "14x17.5" ? "14x17.5" : "10x14";
    const pages = [10, 15, 20].includes(parseInt(item.pages, 10)) ? parseInt(item.pages, 10) : 10;

    // Server trusted price lookup
    const unitPrice = catalogue.getPriceForSpec(sizeKey, pages);
    const itemTotal = unitPrice * qty;

    subtotal += itemTotal;
    totalDiaries += qty;

    validatedItems.push({
      id: item.id || "aaroh-01",
      name: item.name || "Handcrafted Folk-Art Diary",
      designNumber: item.designNumber || "01",
      size: sizeKey,
      pages: pages,
      quantity: qty,
      unitPrice: unitPrice,
      itemTotal: itemTotal,
      customization: item.customization ? String(item.customization).slice(0, 120) : ""
    });
  }

  if (validatedItems.length === 0) {
    throw new Error("No valid items in order");
  }

  // Bulk discount rule: 10+ diaries gives 5% off subtotal
  const discount = totalDiaries >= 10 ? Math.round(subtotal * 0.05) : 0;

  // Delivery rule: ₹60 delivery fee, FREE for orders above ₹799
  const netBeforeShipping = subtotal - discount;
  const deliveryFee = netBeforeShipping >= 799 ? 0 : 60;
  const grandTotal = netBeforeShipping + deliveryFee;

  return {
    items: validatedItems,
    pricing: {
      subtotal,
      discount,
      deliveryFee,
      total: grandTotal,
      currency: "INR"
    }
  };
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-razorpay-signature",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS"
    });
    return res.end();
  }

  const [reqPath, queryString] = req.url.split("?");

  // =========================================================================
  // API ROUTING
  // =========================================================================

  // 1. GET /api/config — Public store & gateway configuration
  if (req.method === "GET" && reqPath === "/api/config") {
    return sendJSON(res, 200, {
      storeName: "Rupaantar",
      currency: "INR",
      currencySymbol: "₹",
      deliveryFee: 60,
      freeDeliveryThreshold: 799,
      razorpayKeyId: RAZORPAY_KEY_ID || null,
      isGatewayConfigured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
      supportedPaymentMethods: [
        { id: "UPI", label: "UPI / QR", desc: "Google Pay, PhonePe, Paytm, BHIM or scan QR" },
        { id: "CARD", label: "Credit / Debit Cards", desc: "RuPay, Visa, Mastercard, Maestro (Secure gateway)" },
        { id: "NETBANKING", label: "Net Banking", desc: "All major Indian banks supported" },
        { id: "COD", label: "Cash on Delivery", desc: "Pay with Cash or UPI upon doorstep delivery" }
      ]
    });
  }

  // 2. POST /api/create-order — Server-side order creation & payment gateway linking
  if (req.method === "POST" && reqPath === "/api/create-order") {
    try {
      const body = await parseBody(req);
      const validationError = validateCustomerDetails(body.customer);
      if (validationError) {
        return sendJSON(res, 400, { success: false, message: validationError });
      }

      const { items, pricing } = calculateServerPricing(body.items);
      const paymentMethod = (body.paymentMethod || "COD").toUpperCase();

      const validMethods = ["UPI", "CARD", "NETBANKING", "COD", "WHATSAPP"];
      if (!validMethods.includes(paymentMethod)) {
        return sendJSON(res, 400, { success: false, message: "Invalid payment method" });
      }

      // Handle Cash on Delivery (COD)
      if (paymentMethod === "COD") {
        const order = db.createOrder({
          customer: body.customer,
          items,
          pricing,
          paymentMethod: "COD",
          paymentStatus: "UNPAID / COD",
          orderStatus: "PLACED",
          gateway: {
            provider: "cash_on_delivery",
            paymentTerms: "Pay upon doorstep delivery"
          }
        });

        return sendJSON(res, 201, {
          success: true,
          orderId: order.id,
          paymentMethod: "COD",
          paymentStatus: "UNPAID / COD",
          order
        });
      }

      // Handle Online Payment (UPI, Cards, Net Banking)
      if (!razorpay) {
        return sendJSON(res, 400, {
          success: false,
          code: "GATEWAY_NOT_CONFIGURED",
          message:
            "Razorpay payment gateway credentials are not yet configured in .env. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or choose Cash on Delivery / WhatsApp."
        });
      }

      // Create Razorpay Order
      const localOrderId = db.generateOrderId();
      const rzpOptions = {
        amount: Math.round(pricing.total * 100), // Amount in paise
        currency: "INR",
        receipt: localOrderId,
        notes: {
          orderId: localOrderId,
          customerName: body.customer.name,
          phone: body.customer.phone,
          paymentMethod: paymentMethod
        }
      };

      const rzpOrder = await razorpay.orders.create(rzpOptions);

      // Save initial order in persistent DB
      const order = db.createOrder({
        id: localOrderId,
        customer: body.customer,
        items,
        pricing,
        paymentMethod,
        paymentStatus: "PENDING",
        orderStatus: "PLACED",
        gateway: {
          provider: "razorpay",
          razorpayOrderId: rzpOrder.id,
          amountPaise: rzpOrder.amount,
          createdAt: new Date().toISOString()
        }
      });

      return sendJSON(res, 201, {
        success: true,
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: RAZORPAY_KEY_ID,
        customer: {
          name: body.customer.name,
          phone: body.customer.phone,
          email: body.customer.email || ""
        },
        order
      });
    } catch (err) {
      console.error("Order creation error:", err);
      return sendJSON(res, 500, { success: false, message: err.message || "Failed to create order" });
    }
  }

  // 3. POST /api/verify-payment — Secure HMAC-SHA256 signature verification
  if (req.method === "POST" && reqPath === "/api/verify-payment") {
    try {
      const body = await parseBody(req);
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return sendJSON(res, 400, { success: false, message: "Missing required payment verification parameters" });
      }

      if (!RAZORPAY_KEY_SECRET) {
        return sendJSON(res, 500, { success: false, message: "Server payment gateway secret not configured" });
      }

      // Verify HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isSignatureValid = expectedSignature === razorpay_signature;

      if (!isSignatureValid) {
        console.warn(`[SECURITY ALERT] Payment signature mismatch for order ${orderId}`);
        db.updateOrder(orderId, {
          paymentStatus: "FAILED",
          paymentNote: "HMAC signature mismatch detected during client verification"
        });
        return sendJSON(res, 400, { success: false, message: "Payment verification failed: Signature mismatch" });
      }

      // Verify payment details with Razorpay API directly
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentDetails.status !== "captured" && paymentDetails.status !== "authorized") {
          console.warn(`Payment ${razorpay_payment_id} status is ${paymentDetails.status}, not captured/authorized`);
        }
      } catch (fetchErr) {
        console.warn("Could not fetch remote payment details:", fetchErr.message);
      }

      // Mark order PAID in database
      const updatedOrder = db.updateOrder(orderId, {
        paymentStatus: "PAID",
        orderStatus: "PROCESSING",
        paymentNote: "Payment successfully verified via Razorpay HMAC signature",
        gateway: {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          verifiedAt: new Date().toISOString()
        }
      });

      console.log(`✓ Order ${orderId} marked PAID successfully (Payment ID: ${razorpay_payment_id})`);
      return sendJSON(res, 200, {
        success: true,
        orderId,
        paymentStatus: "PAID",
        order: updatedOrder
      });
    } catch (err) {
      console.error("Payment verification error:", err);
      return sendJSON(res, 500, {
        success: false,
        message: err.message || "Payment verification encountered an error"
      });
    }
  }

  // 4. POST /api/webhook/razorpay — Idempotent Webhook Processing
  if (req.method === "POST" && reqPath === "/api/webhook/razorpay") {
    try {
      const rawBody = await parseRawBody(req);
      const webhookSignature = req.headers["x-razorpay-signature"];

      if (RAZORPAY_WEBHOOK_SECRET) {
        if (!webhookSignature) {
          return sendJSON(res, 400, { success: false, message: "Missing webhook signature" });
        }
        const expectedSig = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");

        if (expectedSig !== webhookSignature) {
          console.warn("[SECURITY] Webhook signature verification failed");
          return sendJSON(res, 400, { success: false, message: "Invalid webhook signature" });
        }
      }

      const event = JSON.parse(rawBody);
      console.log(`[WEBHOOK] Received event: ${event.event}`);

      // Handle payment captured
      if (event.event === "payment.captured" || event.event === "order.paid") {
        const paymentEntity = event.payload.payment.entity;
        const rzpOrderId = paymentEntity.order_id;
        const rzpPaymentId = paymentEntity.id;

        const order = db.getOrderByRazorpayOrderId(rzpOrderId);
        if (order) {
          if (order.paymentStatus !== "PAID") {
            db.updateOrder(order.id, {
              paymentStatus: "PAID",
              orderStatus: "PROCESSING",
              paymentNote: `Payment captured via webhook (${event.event})`,
              gateway: {
                razorpayOrderId: rzpOrderId,
                razorpayPaymentId: rzpPaymentId,
                verifiedAt: new Date().toISOString()
              }
            });
            console.log(`[WEBHOOK] Order ${order.id} marked PAID via webhook.`);
          } else {
            console.log(`[WEBHOOK] Order ${order.id} already marked PAID (idempotent ignore).`);
          }
        }
      } else if (event.event === "payment.failed") {
        const paymentEntity = event.payload.payment.entity;
        const rzpOrderId = paymentEntity.order_id;
        const order = db.getOrderByRazorpayOrderId(rzpOrderId);
        if (order && order.paymentStatus !== "PAID") {
          db.updateOrder(order.id, {
            paymentStatus: "FAILED",
            paymentNote: `Payment failed: ${paymentEntity.error_description || "Unknown error"}`
          });
        }
      }

      return sendJSON(res, 200, { status: "ok" });
    } catch (err) {
      console.error("Webhook processing error:", err);
      return sendJSON(res, 500, { status: "error", message: err.message });
    }
  }

  // 5. GET /api/orders/:id — Retrieve order details
  if (req.method === "GET" && reqPath.startsWith("/api/orders/")) {
    const orderId = reqPath.replace("/api/orders/", "");
    const order = db.getOrderById(orderId);
    if (!order) {
      return sendJSON(res, 404, { success: false, message: "Order not found" });
    }
    return sendJSON(res, 200, { success: true, order });
  }

  // 6. POST /api/orders/:id/cancel — Cancel order
  if (req.method === "POST" && reqPath.match(/^\/api\/orders\/[^/]+\/cancel$/)) {
    const orderId = reqPath.split("/")[3];
    const order = db.getOrderById(orderId);
    if (!order) {
      return sendJSON(res, 404, { success: false, message: "Order not found" });
    }
    if (order.orderStatus === "DISPATCHED" || order.orderStatus === "DELIVERED") {
      return sendJSON(res, 400, {
        success: false,
        message: `Cannot cancel order already ${order.orderStatus.toLowerCase()}`
      });
    }

    const updated = db.updateOrder(orderId, {
      orderStatus: "CANCELLED",
      statusNote: "Order cancelled by customer"
    });
    return sendJSON(res, 200, { success: true, order: updated });
  }

  // 7. POST /api/admin/login — Admin verification
  if (req.method === "POST" && reqPath === "/api/admin/login") {
    const body = await parseBody(req);
    if (body.passcode === ADMIN_API_KEY) {
      return sendJSON(res, 200, { success: true, token: ADMIN_API_KEY });
    }
    return sendJSON(res, 401, { success: false, message: "Invalid admin passcode" });
  }

  // 8. GET /api/admin/orders — Protected Admin Order Management
  if (req.method === "GET" && reqPath === "/api/admin/orders") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token !== ADMIN_API_KEY) {
      return sendJSON(res, 403, { success: false, message: "Unauthorized. Admin credentials required." });
    }

    const orders = db.listOrders();
    const stats = db.getStats();
    return sendJSON(res, 200, { success: true, orders, stats });
  }

  // 9. PATCH /api/admin/orders/:id/status — Update fulfilment status / COD collection
  if (req.method === "PATCH" && reqPath.match(/^\/api\/admin\/orders\/[^/]+\/status$/)) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token !== ADMIN_API_KEY) {
      return sendJSON(res, 403, { success: false, message: "Unauthorized. Admin credentials required." });
    }

    const orderId = reqPath.split("/")[4];
    const body = await parseBody(req);
    const updates = {};

    if (body.orderStatus) updates.orderStatus = body.orderStatus;
    if (body.paymentStatus) updates.paymentStatus = body.paymentStatus;
    if (body.note) updates.statusNote = body.note;

    const updated = db.updateOrder(orderId, updates);
    if (!updated) {
      return sendJSON(res, 404, { success: false, message: "Order not found" });
    }
    return sendJSON(res, 200, { success: true, order: updated });
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  let filePath = reqPath;
  if (filePath === "/") filePath = "/index.html";
  if (filePath === "/admin") filePath = "/index.html"; // SPA admin route

  const resolvedPath = path.join(__dirname, filePath);

  // Security: Prevent directory traversal outside __dirname
  if (!resolvedPath.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("403 Forbidden");
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(resolvedPath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Server Error: " + err.code);
      }
    } else {
      res.writeHead(200, {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN"
      });
      res.end(content);
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
