module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  return res.status(200).json({
    storeName: "Rupaantar",
    currency: "INR",
    currencySymbol: "₹",
    deliveryFee: 60,
    freeDeliveryThreshold: 799,
    whatsappNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "917972639254",
    upiId: process.env.MERCHANT_UPI_ID || "7972639254@ybl",
    payeeName: process.env.MERCHANT_PAYEE_NAME || "Atharva Giri",
    isGatewayConfigured: true,
    supportedPaymentMethods: [
      { id: "UPI", label: "UPI / QR", desc: "Google Pay, PhonePe, Paytm, BHIM or scan QR" },
      { id: "CARD", label: "Credit / Debit Cards", desc: "RuPay, Visa, Mastercard, Maestro" },
      { id: "NETBANKING", label: "Net Banking", desc: "All major Indian banks supported" },
      { id: "COD", label: "Cash on Delivery", desc: "Pay with Cash or UPI upon doorstep delivery" }
    ]
  });
};
