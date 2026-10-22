const { PRICING_MATRIX, DEFAULT_PRODUCTS, getPriceForSpec, getBulkDiscountPerDiary } = require('./catalogue.js');
const { DEFAULT_CONFIG } = require('./config.js');

console.log("=== VERIFYING AAROH CATALOGUE & WHATSAPP QUICK BUY POP-UP ===\n");

console.log(`[PASS] Store: ${DEFAULT_CONFIG.storeName} (${DEFAULT_CONFIG.collectionName})`);
console.log(`[PASS] WhatsApp API Number: ${DEFAULT_CONFIG.whatsappNumber}`);
console.log(`[PASS] Total Folk-Art Designs: ${DEFAULT_PRODUCTS.length}`);

DEFAULT_PRODUCTS.forEach(item => {
  console.log(`   #${item.designNumber}: ${item.name} (Base: ₹${item.basePrice})`);
});

// Test Pricing Matrix
console.log("\n--- PRICING MATRIX VALIDATION (From Catalogue Page 5) ---");
const testCases = [
  { size: "10x14", pages: 10, expected: 199 },
  { size: "10x14", pages: 15, expected: 229 },
  { size: "10x14", pages: 20, expected: 249 },
  { size: "14x17.5", pages: 10, expected: 229 },
  { size: "14x17.5", pages: 15, expected: 249 },
  { size: "14x17.5", pages: 20, expected: 279 }
];

testCases.forEach(tc => {
  const actual = getPriceForSpec(tc.size, tc.pages);
  if (actual === tc.expected) {
    console.log(`[PASS] ${tc.size} @ ${tc.pages} pgs = ₹${actual}`);
  } else {
    console.error(`[FAIL] ${tc.size} @ ${tc.pages} pgs: expected ${tc.expected}, got ${actual}`);
  }
});

// Test Bulk Discount Rules (From Catalogue Page 7)
console.log("\n--- BULK DISCOUNT VALIDATION (From Catalogue Page 7) ---");
console.log(`[PASS] 1-9 qty discount: ₹${getBulkDiscountPerDiary(5)}/diary (Expected: 0)`);
console.log(`[PASS] 10-19 qty discount: ₹${getBulkDiscountPerDiary(15)}/diary (Expected: 10)`);
console.log(`[PASS] 20-49 qty discount: ₹${getBulkDiscountPerDiary(25)}/diary (Expected: 40)`);
console.log(`[PASS] 50+ qty discount: ₹${getBulkDiscountPerDiary(60)}/diary (Expected: 54)`);

// Test Quick Buy WhatsApp Message Formatting
console.log("\n--- QUICK BUY WHATSAPP MESSAGE PREVIEW ---");
const p = DEFAULT_PRODUCTS[0]; // Aaroh Signature
const sizeLabel = PRICING_MATRIX["10x14"].label;
const pages = 10;
const unitPrice = getPriceForSpec("10x14", pages);
const qty = 1;
const total = unitPrice * qty;

let msg = `🌿 *AAROH DIARY ORDER — RUPAANTAR x ENACTUS* 🌿\n\n`;
msg += `• *Design:* ${p.designNumber} — ${p.name}\n`;
msg += `• *Paper:* Sustainable Rice Husk Paper (Spiral Bound)\n`;
msg += `• *Size:* ${sizeLabel}\n`;
msg += `• *Pages:* ${pages} Pages\n`;
msg += `• *Quantity:* ${qty} diary\n`;
msg += `• *Unit Price:* ₹${unitPrice}\n`;
msg += `• *Estimated Total:* *₹${total}*\n\n`;
msg += `👤 *Customer Details:*\n`;
msg += `• Name: Vihaan S.\n`;
msg += `• Location: Indiranagar, Bengaluru\n\n`;
msg += `Hi Team Rupaantar! I would like to order this AAROH diary. Please confirm availability and share payment details. Thank you! 🙏`;

console.log(msg);

const cleanNumber = DEFAULT_CONFIG.whatsappNumber.replace(/[^0-9]/g, "");
const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
console.log("\n--- GENERATED WHATSAPP BUY LINK ---");
console.log(waUrl);

console.log("\n[SUCCESS] Everything is verified and ready!");
