/**
 * End-to-End User Journey Simulation for Rupantar Ordering System
 */

const assert = require('assert');
const { DEFAULT_CONFIG, getWhatsAppUrl } = require('./config.js');
const { PRICING_MATRIX, DEFAULT_PRODUCTS, getPriceForSpec, getBulkDiscountPerDiary } = require('./catalogue.js');

console.log("=== RUPANTAR END-TO-END USER JOURNEY SIMULATION ===\n");

// Step 1: Customer visits website and browses the 8 designs
console.log("Step 1: Browsing catalogue...");
const product = DEFAULT_PRODUCTS[0]; // Aaroh Signature
console.log(`Selected: ${product.designNumber} — ${product.name}`);

// Step 2: Customer customizes diary (Size: 14x17.5 Large, Pages: 20 Pages)
console.log("\nStep 2: Selecting variants...");
const sizeKey = "14x17.5";
const pages = 20;
const unitPrice = getPriceForSpec(sizeKey, pages);
console.log(`Specs: ${PRICING_MATRIX[sizeKey].label}, ${pages} Pages @ ₹${unitPrice}/diary`);
assert.strictEqual(unitPrice, 279, "14x17.5 @ 20 pgs should be ₹279");

// Step 3: Customer enters bulk quantity = 200 diaries for corporate gifting
console.log("\nStep 3: Entering bulk quantity (200 diaries)...");
const qty = 200;
const bulkDiscount = getBulkDiscountPerDiary(qty); // ₹54
const discountedUnit = unitPrice - bulkDiscount; // 279 - 54 = 225
const subtotal = discountedUnit * qty; // 45,000
const savings = bulkDiscount * qty; // 10,800
console.log(`Bulk Tier Applied: -₹${bulkDiscount}/diary`);
console.log(`Unit Price: ₹${discountedUnit} | Total: ₹${subtotal.toLocaleString('en-IN')} (Saved ₹${savings.toLocaleString('en-IN')})`);
assert.strictEqual(discountedUnit, 225);
assert.strictEqual(subtotal, 45000);

// Step 4: Customer enters customisation and contact details
console.log("\nStep 4: Providing customisation and contact details...");
const customer = {
  name: "Meera Sen",
  phone: "9876543210",
  city: "Bengaluru 560038",
  address: "102 Indiranagar 100ft Road",
  customisation: "Emboss Logo: Sen Tech Annual Gala 2026"
};

// Step 5: WhatsApp order link generation
console.log("\nStep 5: Generating WhatsApp order link...");
let orderMsg = `🌿 *RUPANTAR DIARY ORDER* 🌿\n\n`;
orderMsg += `• Design: ${product.designNumber} — ${product.name}\n`;
orderMsg += `• Size: ${PRICING_MATRIX[sizeKey].label}\n`;
orderMsg += `• Pages: ${pages} Pages\n`;
orderMsg += `• Quantity: ${qty} diaries\n`;
orderMsg += `• Unit Price: ₹${discountedUnit} (Saved ₹${savings})\n`;
orderMsg += `• Item Total: ₹${subtotal}\n`;
orderMsg += `• Customisation: "${customer.customisation}"\n`;
orderMsg += `• Customer: ${customer.name} (${customer.phone})\n`;
orderMsg += `• Location: ${customer.address}, ${customer.city}\n`;

const waUrl = getWhatsAppUrl(orderMsg);
assert(waUrl.includes("wa.me/919876543210"));
assert(waUrl.includes("Sen%20Tech"));
console.log("[PASS] WhatsApp order link ready for transmission");

console.log("\n=== SIMULATION COMPLETED: 100% SUCCESSFUL ===");
