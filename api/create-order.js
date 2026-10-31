module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const paymentMethod = (body.paymentMethod || "UPI").toUpperCase();
    const upiId = process.env.MERCHANT_UPI_ID || "7972639254@ybl";
    const payeeName = process.env.MERCHANT_PAYEE_NAME || "Atharva Giri";
    const localOrderId = "RUP-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

    const items = body.items || [];
    let subtotal = 0;
    for (const item of items) {
      const qty = parseInt(item.quantity, 10) || 1;
      const pages = parseInt(item.pages, 10) || 10;
      const isLarge = item.size && (String(item.size).includes("14x17.5") || String(item.size).toLowerCase().includes("large"));
      let price = 199;
      if (!isLarge) {
        if (pages === 15) price = 229;
        else if (pages === 20) price = 249;
      } else {
        if (pages === 10) price = 229;
        else if (pages === 15) price = 249;
        else if (pages === 20) price = 279;
      }
      subtotal += price * qty;
    }

    const totalQty = items.reduce((s, i) => s + (parseInt(i.quantity, 10) || 1), 0);
    const discount = totalQty >= 10 ? Math.round(subtotal * 0.05) : 0;
    const delivery = subtotal - discount >= 799 ? 0 : 60;
    const totalAmount = subtotal - discount + delivery;

    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Rupaantar ${localOrderId}`)}&tr=${localOrderId}`;

    const order = {
      id: localOrderId,
      createdAt: new Date().toISOString(),
      customer: body.customer || {},
      items,
      pricing: { subtotal, discount, deliveryFee: delivery, total: totalAmount, currency: "INR" },
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "UNPAID / COD" : "AWAITING_PAYMENT",
      orderStatus: "PLACED",
      gateway: {
        provider: paymentMethod === "COD" ? "cash_on_delivery" : "direct_upi",
        upiId,
        payeeName,
        upiIntentUrl,
        amount: totalAmount
      }
    };

    return res.status(201).json({
      success: true,
      orderId: localOrderId,
      paymentMethod,
      paymentStatus: order.paymentStatus,
      upiId,
      payeeName,
      amount: totalAmount,
      upiIntentUrl,
      customer: body.customer,
      order
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to create order" });
  }
};
