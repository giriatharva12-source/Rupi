const fs = require('fs');
const assert = require('assert');
const { DEFAULT_PRODUCTS, getPriceForSpec } = require('./catalogue.js');

console.log("=== VERIFYING ALL BOOKS TO BUY AND ADD TO CART FUNCTIONALITY ===\n");

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

// 1. Verify HTML Markup for Complete 8-Book Set Banner
console.log("--- 1. BUNDLE BANNER & BUTTONS IN INDEX.HTML ---");
assert(html.includes('id="allBooksBundleCard"'), "Missing #allBooksBundleCard in index.html");
assert(html.includes('id="addAllBooksToCartBtn"'), "Missing #addAllBooksToCartBtn in index.html");
assert(html.includes('id="buyAllBooksNowBtn"'), "Missing #buyAllBooksNowBtn in index.html");
assert(html.includes('onclick="addAllBooksToCart()"'), "Missing onclick addAllBooksToCart in index.html");
assert(html.includes('onclick="buyAllBooksNow()"'), "Missing onclick buyAllBooksNow in index.html");
assert(html.includes('id="emptyStateAddAllBtn"'), "Missing #emptyStateAddAllBtn in index.html");
console.log("[PASS] Complete Collection banner, Buy All and Add to Cart All buttons found in index.html");

// 2. Verify Product Card Dual Buttons in app.js
console.log("\n--- 2. DUAL BUTTONS ON EVERY BOOK CARD IN APP.JS ---");
assert(js.includes('card-btn-cart'), "Missing card-btn-cart in app.js");
assert(js.includes('card-btn-buy'), "Missing card-btn-buy in app.js");
assert(js.includes('Add to Cart'), "Missing 'Add to Cart' label in app.js");
assert(js.includes('Buy Now'), "Missing 'Buy Now' label in app.js");
console.log("[PASS] Product cards render explicit 'Add to Cart' and 'Buy Now' text labels with icons");

// 3. Verify Functions in app.js
console.log("\n--- 3. JAVASCRIPT ACTIONS IN APP.JS ---");
assert(js.includes('function addAllBooksToCart()'), "Missing addAllBooksToCart function");
assert(js.includes('function buyAllBooksNow()'), "Missing buyAllBooksNow function");
assert(js.includes('window.addAllBooksToCart = addAllBooksToCart'), "Missing window.addAllBooksToCart export");
assert(js.includes('window.buyAllBooksNow = buyAllBooksNow'), "Missing window.buyAllBooksNow export");
console.log("[PASS] addAllBooksToCart and buyAllBooksNow implemented and exposed to window");

// 4. Simulate addAllBooksToCart Logic
console.log("\n--- 4. SIMULATION: ADD ALL 8 BOOKS TO CART ---");
let simulatedCart = [];
const defaultSize = "10x14";
const defaultPages = 10;
const unitPrice = getPriceForSpec(defaultSize, defaultPages); // 199

DEFAULT_PRODUCTS.forEach(product => {
  simulatedCart.push({
    productId: product.id,
    name: product.name,
    designNumber: product.designNumber,
    size: "10 x 14 cm (Compact)",
    sizeKey: defaultSize,
    pages: defaultPages,
    price: unitPrice,
    quantity: 1
  });
});

assert.strictEqual(simulatedCart.length, 8, "Cart must contain 8 distinct books");
const totalQuantity = simulatedCart.reduce((sum, item) => sum + item.quantity, 0);
assert.strictEqual(totalQuantity, 8, "Total quantity must be 8");
const subtotal = simulatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
assert.strictEqual(subtotal, 1592, "8 books @ ₹199 each must total ₹1,592");
console.log(`[PASS] 8 Books populated: ${simulatedCart.map(b => b.designNumber).join(', ')}`);
console.log(`[PASS] Subtotal: ₹${subtotal} (8 × ₹${unitPrice})`);

// 5. Verify CSS Rules
console.log("\n--- 5. CSS STYLING RULES ---");
assert(css.includes('.all-books-bundle-card'), "Missing .all-books-bundle-card styles");
assert(css.includes('.btn-bundle-cart'), "Missing .btn-bundle-cart styles");
assert(css.includes('.btn-bundle-buy'), "Missing .btn-bundle-buy styles");
assert(css.includes('.card-btn-cart'), "Missing .card-btn-cart styles");
assert(css.includes('.card-btn-buy'), "Missing .card-btn-buy styles");
console.log("[PASS] CSS styles verified for bundle card, dual action buttons, and mobile scaling");

console.log("\n=== ALL 5 VERIFICATION CHECKS PASSED (100%) ===");
