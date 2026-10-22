const fs = require("fs");
/**
 * Comprehensive Automated Test Suite for Rupantar Ordering System
 * Tests: Product Catalogue, Pricing Matrix, Bulk Discount Tiers (including 200 diaries),
 * Customisation encoding, WhatsApp URL encoding, and Validation States.
 */

const assert = require('assert');
const { DEFAULT_CONFIG, isValidWhatsAppNumber, getWhatsAppUrl } = require('./config.js');
const { PRICING_MATRIX, DEFAULT_PRODUCTS, getPriceForSpec, getBulkDiscountPerDiary } = require('./catalogue.js');

console.log("=== RUPANTAR ORDERING & WHATSAPP INTEGRATION TEST SUITE ===\n");

// 1. WhatsApp Configuration Validation
console.log("--- 1. CONFIGURATION TESTS ---");
assert.strictEqual(DEFAULT_CONFIG.storeName, "Rupaantar", "Store name should be Rupaantar");
assert(isValidWhatsAppNumber(DEFAULT_CONFIG.whatsappNumber), "Default WhatsApp number must be valid digits");
console.log("[PASS] Store Name:", DEFAULT_CONFIG.storeName);
console.log("[PASS] WhatsApp Business Number (Digits only):", DEFAULT_CONFIG.whatsappNumber);

// Test invalid number detection
assert(!isValidWhatsAppNumber(""), "Empty phone should be invalid");
assert(!isValidWhatsAppNumber("123"), "Too short number should be invalid");
console.log("[PASS] Invalid WhatsApp numbers successfully rejected");

// 2. Catalogue & 8 Designs Verification
console.log("\n--- 2. CATALOGUE VERIFICATION ---");
assert.strictEqual(DEFAULT_PRODUCTS.length, 8, "Must contain exactly 8 folk-art designs");
const expectedNames = [
  "Aaroh Signature",
  "Veena & Mandala",
  "Rooted",
  "Warli Circle",
  "Details",
  "Tree of Life Deer",
  "Made to Keep",
  "Culture"
];
DEFAULT_PRODUCTS.forEach((p, idx) => {
  assert.strictEqual(p.name, expectedNames[idx], "Product " + p.designNumber + " name mismatch");
  assert(p.shortDescription.length > 10, "Product " + p.designNumber + " must have description");
  console.log(`[PASS] Design ${p.designNumber}: ${p.name}`);
});

// 3. Pricing Matrix Verification
console.log("\n--- 3. PRICING MATRIX TESTS ---");
assert.strictEqual(getPriceForSpec("10x14", 10), 199);
assert.strictEqual(getPriceForSpec("10x14", 15), 229);
assert.strictEqual(getPriceForSpec("10x14", 20), 249);
assert.strictEqual(getPriceForSpec("14x17.5", 10), 229);
assert.strictEqual(getPriceForSpec("14x17.5", 15), 249);
assert.strictEqual(getPriceForSpec("14x17.5", 20), 279);
console.log("[PASS] 10x14 Compact (10/15/20 pgs): ₹199 / ₹229 / ₹249");
console.log("[PASS] 14x17.5 Large (10/15/20 pgs): ₹229 / ₹249 / ₹279");

// 4. Bulk Discount Tiers Verification
console.log("\n--- 4. BULK DISCOUNT TESTS ---");
assert.strictEqual(getBulkDiscountPerDiary(1), 0, "1 qty: 0 discount");
assert.strictEqual(getBulkDiscountPerDiary(9), 0, "9 qty: 0 discount");
assert.strictEqual(getBulkDiscountPerDiary(10), 10, "10 qty: 10 discount");
assert.strictEqual(getBulkDiscountPerDiary(19), 10, "19 qty: 10 discount");
assert.strictEqual(getBulkDiscountPerDiary(20), 40, "20 qty: 40 discount");
assert.strictEqual(getBulkDiscountPerDiary(49), 40, "49 qty: 40 discount");
assert.strictEqual(getBulkDiscountPerDiary(50), 54, "50 qty: 54 discount");
assert.strictEqual(getBulkDiscountPerDiary(200), 54, "200 qty: 54 discount");

// Test 200 Diaries Bulk Order Calculation
const unitBase = getPriceForSpec("10x14", 20); // 249
const discountPerDiary = getBulkDiscountPerDiary(200); // 54
const discountedUnit = unitBase - discountPerDiary; // 195
const bulkTotal = discountedUnit * 200; // 39,000
const totalSaved = discountPerDiary * 200; // 10,800
assert.strictEqual(bulkTotal, 39000, "200 diaries total must be 39,000");
assert.strictEqual(totalSaved, 10800, "200 diaries savings must be 10,800");
console.log(`[PASS] 200 Diaries Bulk Order: ₹${unitBase} - ₹${discountPerDiary} = ₹${discountedUnit}/diary | Total: ₹${bulkTotal} (Savings: ₹${totalSaved})`);

// 5. WhatsApp Click-to-Chat Link Generation & URL Encoding
console.log("\n--- 5. WHATSAPP CLICK-TO-CHAT URL ENCODING TESTS ---");
const testMessage = `🌿 *RUPANTAR DIARY ORDER* 🌿
• Design: 01 — Aaroh Signature
• Size: 10 x 14 cm (Compact)
• Pages: 20 Pages
• Quantity: 200 diaries
• Customisation: Name Embossing & Corporate Logo
• Customer: Rahul Sharma & Associates (+91 98765 43210)`;

const generatedUrl = getWhatsAppUrl(testMessage);
assert(generatedUrl.startsWith("https://wa.me/919876543210?text="), "URL must start with https://wa.me/919876543210?text=");
assert(generatedUrl.includes("%20"), "Spaces must be URL encoded");
assert(generatedUrl.includes("%26"), "Ampersands must be properly URL encoded");
assert(generatedUrl.includes("%0A"), "Line breaks must be properly URL encoded");
assert(!generatedUrl.includes(" "), "URL must not contain raw unencoded spaces");
console.log("[PASS] Click-to-chat URL is properly constructed and percent-encoded");
console.log("Sample URL:", generatedUrl.substring(0, 80) + "...");

// 6. Responsive & Asset Existence Checks
console.log("\n--- 6. ASSET INTEGRITY CHECKS ---");
for (let i = 1; i <= 8; i++) {
  const pad = "0" + i;
  const p = "D:/rupaantar-store/assets/images/design-" + pad + ".png";
  assert(fs.existsSync(p), "Missing asset: " + p);
}
assert(fs.existsSync("D:/rupaantar-store/assets/images/rupaantar-logo.png"), "Missing logo");
console.log("[PASS] All 8 design PNG assets and logo verified on disk");

console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! (100% Correctness) ===");
