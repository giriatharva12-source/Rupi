
function toggleCartDeliveryForm() {
  const form = document.getElementById("deliveryForm");
  const arrow = document.getElementById("accordionArrow");
  if (!form) return;
  const isHidden = window.getComputedStyle(form).display === "none";
  if (isHidden) {
    form.style.display = "flex";
    if (arrow) arrow.textContent = "▲";
  } else {
    form.style.display = "none";
    if (arrow) arrow.textContent = "▼";
  }
}

/**
 * Rupantar Store Application Logic
 * 
 * Manages catalogue rendering of the 8 folk-art covers,
 * Size & Page pricing matrix, bulk discounts,
 * customer customisation options, and WhatsApp order routing.
 */

// Global State
let currentConfig = getStoreConfig();
let currentCatalogue = getProductCatalogue();
let searchQuery = "";
let cart = loadCart();

// Quick Buy Modal State
let qbProduct = null;
let qbSize = "10x14";
let qbPages = 10;
let qbQty = 1;

// Last Order Cache for Next-Step Modal
let lastWhatsAppOrderUrl = "";
let lastWhatsAppOrderText = "";

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initStoreInfo();
  renderEthosPillars();
  renderCatalogue();
  updateCartUI();
  initEventListeners();
  clearCustomerFormInputs();
  initQuickBuyDefaults();
  checkUrlDeepLinks();
});

/* ==========================================================================
   Store Configuration & Brand Setup
   ========================================================================== */
function initStoreInfo() {
  currentConfig = getStoreConfig();
  
  const navStoreName = document.getElementById("navStoreName");
  if (navStoreName) navStoreName.textContent = currentConfig.storeName || "Rupantar";

  const footerStoreName = document.getElementById("footerStoreName");
  if (footerStoreName) footerStoreName.textContent = currentConfig.storeName || "Rupantar";

  const footerWa = document.getElementById("footerWhatsAppLink");
  if (footerWa) {
    const cleanNumber = (currentConfig.whatsappNumber || "919876543210").replace(/[^0-9]/g, "");
    footerWa.textContent = currentConfig.whatsappDisplayNumber || ("+" + cleanNumber);
    footerWa.href = "https://wa.me/" + cleanNumber + "?text=" + encodeURIComponent("Hi Team " + (currentConfig.storeName || "Rupantar") + "! I have an enquiry about your handcrafted rice husk diaries.");
  }

  const footerInsta = document.getElementById("footerInstagramLink");
  if (footerInsta) {
    footerInsta.href = currentConfig.instagramUrl || "https://www.instagram.com/projectrupaantar?mdxt=MXF5NGM0cGJ6M2p3Nw==";
    footerInsta.textContent = currentConfig.instagramHandle || "@projectrupaantar";
  }

  // Header WhatsApp enquiry button
  const headerWa = document.getElementById("headerWhatsAppBtn");
  if (headerWa) {
    const cleanNumber = (currentConfig.whatsappNumber || "919876543210").replace(/[^0-9]/g, "");
    headerWa.href = "https://wa.me/" + cleanNumber + "?text=" + encodeURIComponent("Hi Team " + (currentConfig.storeName || "Rupantar") + "! I would like to enquire about your folk-art diaries.");
  }

  // Floating WhatsApp button for general inquiries
  const floatBtn = document.getElementById("floatingWhatsAppBtn");
  if (floatBtn) {
    const cleanNumber = (currentConfig.whatsappNumber || "919876543210").replace(/[^0-9]/g, "");
    const enquiryMsg = "Hi Team " + (currentConfig.storeName || "Rupantar") + "! I am visiting your website and have an enquiry regarding your handcrafted rice husk paper diaries.";
    floatBtn.href = "https://wa.me/" + cleanNumber + "?text=" + encodeURIComponent(enquiryMsg);
  }
}

/* ==========================================================================
   Ethos & Sustainability Pillars
   ========================================================================== */
function renderEthosPillars() {
  const container = document.getElementById("ethosContainer");
  if (!container) return;

  const features = currentConfig.features || [
    { icon: "🌾", title: "Rice Husk Paper", desc: "Sustainable, earthy, natural texture" },
    { icon: "🎨", title: "8 Folk-Art Covers", desc: "Tradition reimagined by Indian artisans" },
    { icon: "📖", title: "Spiral Bound", desc: "Lies flat 180°, easy to write and flip" },
    { icon: "✨", title: "Bulk & Custom Editions", desc: "Discounts up to ₹54 off for teams & events" }
  ];

  container.innerHTML = features.map(f => `
    <div class="ethos-card">
      <div class="ethos-icon">${f.icon}</div>
      <div class="ethos-text">
        <h4 class="ethos-title">${escapeHTML(f.title)}</h4>
        <p class="ethos-desc">${escapeHTML(f.desc)}</p>
      </div>
    </div>
  `).join("");
}

/* ==========================================================================
   Catalogue Rendering (All 8 Folk-Art Designs)
   ========================================================================== */
function resetCatalogueSearch() {
  searchQuery = "";
  const input = document.getElementById("searchInput") || document.getElementById("searchCatalogInput");
  if (input) input.value = "";
  const clearBtn = document.getElementById("clearSearchBtn");
  if (clearBtn) clearBtn.style.display = "none";
  renderCatalogue();
}

function openCustomQuoteWhatsApp() {
  const cleanNumber = (currentConfig.whatsappNumber || "919876543210").replace(/[^0-9]/g, "");
  const msg = "Hi Team " + (currentConfig.storeName || "Rupantar") + "! I would like to request a custom quote for customized / bulk folk-art diaries (@projectrupaantar).";
  window.open("https://wa.me/" + cleanNumber + "?text=" + encodeURIComponent(msg), "_blank");
}

function renderCatalogue() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const filtered = currentCatalogue.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) ||
           item.shortDescription.toLowerCase().includes(q) ||
           item.designNumber.includes(q);
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
        <p style="font-size: 1.1rem; color: var(--color-muted);">No folk-art diaries match your search.</p>
        <button class="btn btn-outline" onclick="resetCatalogueSearch()" style="margin-top: 1rem;">
          Show All 8 Designs
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    return `
      <div class="product-card" id="card-${item.id}">
        <div class="product-card-media" onclick="openQuickBuyModal('${item.id}')" style="cursor: pointer;" title="View details for ${escapeHTML(item.name)}">
          <img src="${item.image}" alt="${escapeHTML(item.name)}" class="product-thumb" loading="lazy" onerror="this.src='assets/images/design-01.png'">
        </div>
        
        <div class="product-card-body">
          <div class="product-category-meta" onclick="openQuickBuyModal('${item.id}')" style="cursor: pointer;">
            <span class="card-cat-name">${escapeHTML(item.tag || "Folk Art")}</span>
          </div>

          <h3 class="product-name" onclick="openQuickBuyModal('${item.id}')" style="cursor: pointer;" title="View details for ${escapeHTML(item.name)}">${escapeHTML(item.name)}</h3>

          <div class="product-card-footer">
            <div class="product-card-pricing-row" onclick="openQuickBuyModal('${item.id}')" style="cursor: pointer;">
              <div class="price-group">
                <span class="current-price">From ₹${item.basePrice}</span>
              </div>
            </div>

            <div class="product-card-actions">
              <button class="card-btn-cart" onclick="quickAddToCart('${item.id}', event)" title="Add to bag" aria-label="Add to bag">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8" cy="21" r="1.3"></circle>
                  <circle cx="17" cy="21" r="1.3"></circle>
                  <path d="M1 4.5h3.2l2.2 9.5a1.5 1.5 0 0 0 1.5 1.2h8.5a1.5 1.5 0 0 0 1.5-1.1L19.5 10.5H5.2"></path>
                  <line x1="16" y1="1.5" x2="16" y2="6.5"></line>
                  <line x1="13.5" y1="4" x2="18.5" y2="4"></line>
                </svg>
              </button>
              <button class="card-btn-buy" onclick="openQuickBuyModal('${item.id}')" title="Buy Now">
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function quickAddToCart(productId, event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const product = currentCatalogue.find(p => p.id === productId) || currentCatalogue[0];
  const defaultSize = "10x14";
  const defaultPages = 10;
  const sizeObj = PRICING_MATRIX[defaultSize] || PRICING_MATRIX["10x14"];
  const unitPrice = getPriceForSpec(defaultSize, defaultPages);

  const existingItem = cart.find(i => 
    i.productId === product.id && 
    (i.sizeKey === defaultSize || i.size === sizeObj.label) && 
    i.pages === defaultPages && 
    !i.customisation
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: `${product.id}-${defaultSize}-${defaultPages}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      designNumber: product.designNumber,
      size: sizeObj.label,
      sizeKey: defaultSize,
      pages: defaultPages,
      price: unitPrice,
      quantity: 1,
      image: product.image,
      customisation: ""
    });
  }

  saveCart(cart);
  updateCartUI();
  openCart();
  showToast(`Added 1 × ${product.name} to your bag! 🛍️`);
}

/* ==========================================================================
   Quick Buy / Product Ordering Modal Engine
   ========================================================================== */
function initQuickBuyDefaults() {
  qbProduct = currentCatalogue[0];
  qbSize = "10x14";
  qbPages = 10;
  qbQty = 1;
}

function openQuickBuyModal(productId) {
  const product = currentCatalogue.find(p => p.id === productId) || currentCatalogue[0];
  qbProduct = product;
  qbSize = "10x14";
  qbPages = 10;
  qbQty = 1;
  goToQuickBuyStep(1);

  // Populate Design Variant Selector Dropdown
  const designDropdown = document.getElementById("qbDesignDropdown");
  if (designDropdown) {
    designDropdown.innerHTML = currentCatalogue.map(p => 
      `<option value="${p.id}" ${p.id === product.id ? 'selected' : ''}>${p.designNumber} — ${p.name}</option>`
    ).join("");
  }

  // Update Header Titles
  updateQuickBuyHeader();

  // Reset Size Chips
  const sizeChips = document.querySelectorAll("#qbSizeSelector .qb-chip");
  sizeChips.forEach(c => c.classList.toggle("active", c.getAttribute("data-size") === "10x14"));

  // Reset Page Chips
  const pageChips = document.querySelectorAll("#qbPageSelector .qb-chip");
  pageChips.forEach(c => c.classList.toggle("active", c.getAttribute("data-pages") === "10"));

  // Reset Quantity Input
  const qtyInput = document.getElementById("qbQtyInput");
  if (qtyInput) qtyInput.value = 1;

  // Reset errors
  hideValidationErrors();

  // Pre-fill saved customer info
  prefillCustomerInfo();

  // Update Calculations
  updateQuickBuyCalculations();

  const backdrop = document.getElementById("quickBuyModalBackdrop");
  if (backdrop) backdrop.classList.add("active");
  document.body.style.overflow = "hidden";
}

function updateQuickBuyHeader() {
  if (!qbProduct) return;
  const title = document.getElementById("qbDesignTitle");
  const sub = document.getElementById("qbDesignTagline");
  const img = document.getElementById("qbProductImg");
  const tag = document.getElementById("qbProductTag");

  if (title) title.textContent = `${qbProduct.designNumber}. ${qbProduct.name}`;
  if (sub) sub.textContent = qbProduct.shortDescription || qbProduct.tagline || "Handcrafted folk-art diary made from sustainable rice husk paper.";
  if (img) {
    img.src = qbProduct.image;
    img.alt = `${qbProduct.name} Handcrafted Diary`;
  }
  if (tag) tag.style.display = "none";

  // Update Direct Link Preview
  const previewInput = document.getElementById("qbDirectLinkPreview");
  if (previewInput) {
    const baseUrl = getStoreBaseUrl();
    previewInput.value = `${baseUrl}?design=${qbProduct.designNumber}`;
  }
}

function switchQuickBuyDesign(productId) {
  const product = currentCatalogue.find(p => p.id === productId);
  if (product) {
    qbProduct = product;
    updateQuickBuyHeader();
    updateQuickBuyCalculations();
  }
}

function closeQuickBuyModal() {
  const backdrop = document.getElementById("quickBuyModalBackdrop");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

function setQuickBuySize(sizeKey, btn) {
  qbSize = sizeKey;
  document.querySelectorAll("#qbSizeSelector .qb-chip").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  updateQuickBuyCalculations();
}

function setQuickBuyPages(pages, btn) {
  qbPages = parseInt(pages, 10);
  document.querySelectorAll("#qbPageSelector .qb-chip").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  updateQuickBuyCalculations();
}

function stepQuickBuyQty(delta) {
  const input = document.getElementById("qbQtyInput");
  let val = parseInt(input ? input.value : qbQty, 10) || 1;
  val = Math.max(1, Math.min(5000, val + delta));
  qbQty = val;
  if (input) input.value = val;
  updateQuickBuyCalculations();
}

function handleQuickBuyQtyChange(rawVal) {
  let val = parseInt(rawVal, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 5000) val = 5000;
  qbQty = val;
  updateQuickBuyCalculations();
}

function addCustomPreset(prefix) {
  const field = document.getElementById("qbCustCustomization");
  if (!field) return;
  if (field.value.trim().length === 0) {
    field.value = prefix;
  } else {
    field.value += "; " + prefix;
  }
  field.focus();
}

function updateQuickBuyCalculations() {
  const sizeObj = PRICING_MATRIX[qbSize] || PRICING_MATRIX["10x14"];
  
  // Update chip prices for current size
  const rate10 = document.getElementById("qbRate-10");
  const rate15 = document.getElementById("qbRate-15");
  const rate20 = document.getElementById("qbRate-20");
  if (rate10) rate10.textContent = `Rs. ${sizeObj.pages[10]}`;
  if (rate15) rate15.textContent = `Rs. ${sizeObj.pages[15]}`;
  if (rate20) rate20.textContent = `Rs. ${sizeObj.pages[20]}`;

  const baseUnitPrice = getPriceForSpec(qbSize, qbPages);
  const subtotal = baseUnitPrice * qbQty;
  const hasBulkDiscount = qbQty >= 10;
  const discountAmount = hasBulkDiscount ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = subtotal - discountAmount;

  // Beside Quantity stepper: show TOTAL PRICE (not price per diary)
  const totalBesideQty = document.getElementById("qbUnitPriceDisplay");
  const origBesideQty = document.getElementById("qbOrigUnitPriceDisplay");

  if (totalBesideQty) totalBesideQty.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  if (hasBulkDiscount) {
    if (origBesideQty) {
      origBesideQty.style.display = "inline";
      origBesideQty.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    }
  } else {
    if (origBesideQty) origBesideQty.style.display = "none";
  }

  // Feature: Add X more to get 5% discount / Congratulations Party Popper
  const nudgeContainer = document.getElementById("qbDiscountNudge");
  if (nudgeContainer) {
    if (qbQty < 10) {
      const needed = 10 - qbQty;
      nudgeContainer.innerHTML = `
        <div class="qb-bulk-nudge">
          <span class="nudge-icon">✨</span>
          <span class="nudge-text">Add <strong>${needed} more ${needed === 1 ? 'diary' : 'diaries'}</strong> to get <strong>5% discount</strong> on each book!</span>
        </div>
      `;
    } else {
      nudgeContainer.innerHTML = `
        <div class="qb-congrats-popper" role="status">
          <span class="popper-emoji">🎉</span>
          <div class="popper-msg">
            <strong>Congratulations!</strong> 5% Bulk Discount Applied (Saved ₹${discountAmount.toLocaleString('en-IN')})
          </div>
          <span class="popper-emoji">🎊</span>
        </div>
      `;
    }
  }

  // Grand Total in bottom action bar & Step 2 summary
  const totalDisplay = document.getElementById("qbTotalAmountDisplay");
  const step2TotalDisplay = document.getElementById("qbStep2TotalAmountDisplay");
  const summaryQty = document.getElementById("qbSummaryQty");

  if (totalDisplay) totalDisplay.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
  if (step2TotalDisplay) step2TotalDisplay.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
  if (summaryQty) summaryQty.textContent = `${qbQty} ${qbQty === 1 ? 'diary' : 'diaries'}`;
}

function hideValidationErrors() {
  const nameErr = document.getElementById("qbNameError");
  const phoneErr = document.getElementById("qbPhoneError");
  const nameInput = document.getElementById("qbCustName");
  const phoneInput = document.getElementById("qbCustPhone");

  if (nameErr) nameErr.style.display = "none";
  if (phoneErr) phoneErr.style.display = "none";
  if (nameInput) nameInput.classList.remove("form-input-error");
  if (phoneInput) phoneInput.classList.remove("form-input-error");
}

function prefillCustomerInfo() {
  // Keep all fields completely empty with no pre-written data
  const fields = ["qbCustName", "qbCustPhone", "qbCustCity", "qbCustAddress", "qbCustCustomization"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/* ==========================================================================
   WhatsApp Order Generation & Validation
   ========================================================================== */
function constructQuickBuyWhatsAppMessage() {
  const sizeObj = PRICING_MATRIX[qbSize] || PRICING_MATRIX["10x14"];
  const baseUnitPrice = getPriceForSpec(qbSize, qbPages);
  const subtotal = baseUnitPrice * qbQty;
  const hasBulkDiscount = qbQty >= 10;
  const bulkDiscountAmount = hasBulkDiscount ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = subtotal - bulkDiscountAmount;

  const custName = document.getElementById("qbCustName") ? document.getElementById("qbCustName").value.trim() : "";
  const custPhone = document.getElementById("qbCustPhone") ? document.getElementById("qbCustPhone").value.trim() : "";
  const countryCode = document.getElementById("qbCountryCode") ? document.getElementById("qbCountryCode").value : "+91";
  const custCity = document.getElementById("qbCustCity") ? document.getElementById("qbCustCity").value.trim() : "";
  const custAddress = document.getElementById("qbCustAddress") ? document.getElementById("qbCustAddress").value.trim() : "";
  const customNotes = document.getElementById("qbCustCustomization") ? document.getElementById("qbCustCustomization").value.trim() : "";

  // Order Reference Number
  const orderRef = "RUP-" + Math.floor(1000 + Math.random() * 9000);

  let msg = `🌿 *RUPANTAR DIARY ORDER* 🌿\n`;
  msg += `*Reference:* #${orderRef}\n\n`;

  msg += `📖 *DIARY SPECIFICATIONS:*\n`;
  msg += `• Design: ${qbProduct.designNumber} — ${qbProduct.name}\n`;
  msg += `• Paper: Sustainable Rice Husk Paper (Earth-friendly)\n`;
  msg += `• Binding: Spiral Bound (Lies completely flat 180°)\n`;
  msg += `• Size: ${sizeObj.label}\n`;
  msg += `• Pages: ${qbPages} Pages\n`;
  msg += `• Quantity: ${qbQty} ${qbQty === 1 ? 'diary' : 'diaries'}\n\n`;

  msg += `💰 *PRICE BREAKDOWN:*\n`;
  if (hasBulkDiscount) {
    msg += `• Items Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
    msg += `• Bulk Discount (5% Off 10+ books): -₹${bulkDiscountAmount.toLocaleString('en-IN')}\n`;
  }
  msg += `• *Total Amount: ₹${grandTotal.toLocaleString('en-IN')}*\n`;
  msg += `• Shipping: Confirmed on WhatsApp\n\n`;

  if (customNotes) {
    msg += `🎨 *CUSTOMISATION / BRANDING:*\n`;
    msg += `• Instructions: "${customNotes}"\n\n`;
  }

  msg += `👤 *CUSTOMER DETAILS:*\n`;
  msg += `• Name: ${custName || "Valued Customer"}\n`;
  if (custPhone) {
    const cleanDigits = custPhone.replace(/[^0-9]/g, "");
    msg += `• WhatsApp: ${countryCode} ${cleanDigits}\n`;
  }
  if (custCity) msg += `• City / PIN: ${custCity}\n`;
  if (custAddress) msg += `• Address: ${custAddress}\n`;
  msg += `\n`;

  msg += `Hi Team Rupantar! I would like to confirm and place this order. Please share availability and dispatch timeline!`;
  return msg;
}

function launchQuickBuyWhatsApp() {
  hideValidationErrors();

  const nameInput = document.getElementById("qbCustName");
  const phoneInput = document.getElementById("qbCustPhone");
  const name = nameInput ? nameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";

  let hasError = false;

  if (!name || name.length < 2) {
    const nameErr = document.getElementById("qbNameError");
    if (nameErr) nameErr.style.display = "block";
    if (nameInput) nameInput.classList.add("form-input-error");
    hasError = true;
  }

  const phoneDigits = phone.replace(/[^0-9]/g, "");
  if (!phone || phoneDigits.length !== 10) {
    const phoneErr = document.getElementById("qbPhoneError");
    if (phoneErr) phoneErr.style.display = "block";
    if (phoneInput) phoneInput.classList.add("form-input-error");
    hasError = true;
  }

  if (hasError) {
    showToast("Please enter your name and valid 10-digit WhatsApp number.");
    return;
  }

  // Prevent duplicate clicks & show loading state
  const btn = document.getElementById("qbWhatsAppDirectBtn");
  const originalText = document.getElementById("qbOrderBtnText") ? document.getElementById("qbOrderBtnText").textContent : "";
  if (btn) {
    btn.disabled = true;
    if (document.getElementById("qbOrderBtnText")) {
      document.getElementById("qbOrderBtnText").textContent = "Opening WhatsApp...";
    }
  }

  const msg = constructQuickBuyWhatsAppMessage();
  const cleanNumber = (currentConfig.whatsappNumber || "919876543210").replace(/[^0-9]/g, "");
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;

  lastWhatsAppOrderUrl = url;
  lastWhatsAppOrderText = msg;

  // Open WhatsApp in new window/tab
  window.open(url, "_blank");

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      if (document.getElementById("qbOrderBtnText")) {
        document.getElementById("qbOrderBtnText").textContent = originalText || "Confirm & Order";
      }
    }
    closeQuickBuyModal();
    openOrderConfirmationModal();
  }, 400);
}

function copyQuickBuyWhatsAppLink() {
  const msg = constructQuickBuyWhatsAppMessage();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(msg).then(() => {
      showToast("Order message copied to clipboard! 📋");
    }).catch(() => {
      fallbackCopyText(msg);
    });
  } else {
    fallbackCopyText(msg);
  }
}

function addQuickBuyToCartAndOpen() {
  const sizeObj = PRICING_MATRIX[qbSize] || PRICING_MATRIX["10x14"];
  const baseUnitPrice = getPriceForSpec(qbSize, qbPages);
  const customNotes = document.getElementById("qbCustCustomization") ? document.getElementById("qbCustCustomization").value.trim() : "";

  const existingItem = cart.find(i => 
    i.productId === qbProduct.id && 
    (i.sizeKey === qbSize || i.size === sizeObj.label) && 
    i.pages === qbPages && 
    (i.customisation || "") === customNotes
  );

  if (existingItem) {
    existingItem.quantity += qbQty;
  } else {
    const cartItem = {
      id: `${qbProduct.id}-${qbSize}-${qbPages}-${Date.now()}`,
      productId: qbProduct.id,
      name: qbProduct.name,
      designNumber: qbProduct.designNumber,
      size: sizeObj.label,
      sizeKey: qbSize,
      pages: qbPages,
      price: baseUnitPrice,
      quantity: qbQty,
      image: qbProduct.image,
      customisation: customNotes
    };
    cart.push(cartItem);
  }

  saveCart(cart);
  updateCartUI();
  closeQuickBuyModal();
  openCart();
  showToast(`Added ${qbQty} × ${qbProduct.name} to your bag! 🛍️`);
}

/* ==========================================================================
   Order Confirmation Next-Steps Dialog
   ========================================================================== */
function openOrderConfirmationModal() {
  const backdrop = document.getElementById("orderConfirmationModalBackdrop");
  if (backdrop) backdrop.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeOrderConfirmationModal() {
  const backdrop = document.getElementById("orderConfirmationModalBackdrop");
  if (backdrop) backdrop.style.display = "none";
  document.body.style.overflow = "";
}

function reopenLastWhatsAppOrder() {
  if (lastWhatsAppOrderUrl) {
    window.open(lastWhatsAppOrderUrl, "_blank");
  } else {
    const cleanNumber = (currentConfig.whatsappNumber || "919876543210").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  }
}

function copyLastOrderText() {
  if (lastWhatsAppOrderText) {
    fallbackCopyText(lastWhatsAppOrderText);
  } else {
    showToast("No order message stored.");
  }
}

/* ==========================================================================
   Shopping Bag Cart Storage & State Management
   ========================================================================== */
function loadCart() {
  try {
    const raw = localStorage.getItem("rupaantar_cart");
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    return [];
  }
}

function saveCart(newCart) {
  cart = newCart;
  try {
    localStorage.setItem("rupaantar_cart", JSON.stringify(cart));
  } catch(e) {}
}

function updateCartItemQty(itemId, delta) {
  const item = cart.find(i => i.id === itemId);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeCartItem(itemId);
    return;
  }

  item.quantity = newQty;
  saveCart(cart);
  updateCartUI();
}

function removeCartItem(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  saveCart(cart);
  updateCartUI();
  showToast("Item removed from bag");
}

function updateCartUI() {
  const badge = document.getElementById("cartCountBadge");
  const countSpan = document.getElementById("drawerCartCount");
  const list = document.getElementById("cartItemsList");
  const emptyState = document.getElementById("emptyCartState");
  const checkoutSection = document.getElementById("cartCheckoutSection");
  const discountCard = document.getElementById("cartDiscountCard") || document.getElementById("freeShippingCard");

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  // 10+ books bulk discount (5% off on each book)
  const hasBulkDiscount = totalItems >= 10;
  const discountAmount = hasBulkDiscount ? Math.round(subtotal * 0.05) : 0;
  const finalTotal = subtotal - discountAmount;

  if (badge) badge.textContent = totalItems;
  if (countSpan) countSpan.textContent = `(${totalItems} ${totalItems === 1 ? 'item' : 'items'})`;

  const totalPreview = document.getElementById("cartTotalPreview");
  if (totalPreview) totalPreview.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

  const billSummary = document.getElementById("cartStep1BillSummary");
  const actionBar = document.querySelector(".cart-step-action-bar");
  const cartProgressBar = document.querySelector(".drawer-progress-bar");

  if (cart.length === 0) {
    if (list) list.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (checkoutSection) checkoutSection.style.display = "none";
    if (discountCard) discountCard.style.display = "none";
    if (billSummary) billSummary.style.display = "none";
    if (actionBar) actionBar.style.display = "none";
    if (cartProgressBar) cartProgressBar.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (checkoutSection) checkoutSection.style.display = "block";
  if (discountCard) discountCard.style.display = "block";
  if (billSummary) billSummary.style.display = "block";
  if (actionBar) actionBar.style.display = "block";
  if (cartProgressBar) cartProgressBar.style.display = "flex";

  // Bulk Discount Progress (10+ books: 5% off each book)
  const discountText = document.getElementById("cartDiscountText") || document.getElementById("freeShippingText");
  const discountBar = document.getElementById("cartDiscountBarFill") || document.getElementById("freeShippingBarFill");

  if (hasBulkDiscount) {
    if (discountText) {
      discountText.innerHTML = `🎉 <strong>5% Bulk Discount Applied!</strong> Saved ₹${discountAmount.toLocaleString('en-IN')} on ${totalItems} books.`;
    }
    if (discountBar) {
      discountBar.style.width = "100%";
      discountBar.style.background = "linear-gradient(90deg, #15803d, #22c55e)";
    }
  } else {
    const needed = 10 - totalItems;
    if (discountText) {
      discountText.innerHTML = `Add <strong>${needed} more ${needed === 1 ? 'book' : 'books'}</strong> for <strong>5% OFF on each book</strong>!`;
    }
    if (discountBar) {
      discountBar.style.width = `${Math.min(100, Math.round((totalItems / 10) * 100))}%`;
      discountBar.style.background = "linear-gradient(90deg, var(--color-terracotta), var(--color-gold))";
    }
  }

  // Populate List
  if (list) {
    list.innerHTML = cart.map(item => {
      const lineTotal = item.price * item.quantity;
      return `
        <div class="cart-item-row">
          <img src="${item.image}" alt="${escapeHTML(item.name)}" class="cart-item-thumb" onerror="this.src='assets/images/design-01.png'">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.designNumber ? item.designNumber + '. ' : ''}${escapeHTML(item.name)}</h4>
            <div class="cart-item-specs">
              ${escapeHTML(item.size || '10x14 cm')} • ${item.pages || 10} pgs
            </div>
            ${item.customisation ? `<div class="cart-item-custom-note">Custom: "${escapeHTML(item.customisation)}"</div>` : ''}
            <div class="cart-item-price-unit">₹${item.price} each</div>
          </div>

          <div class="cart-item-controls">
            <div class="cart-stepper">
              <button type="button" class="cart-step-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
              <span class="cart-qty-val">${item.quantity}</span>
              <button type="button" class="cart-step-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
            </div>
            <div class="cart-line-total">₹${lineTotal}</div>
            <button type="button" class="cart-remove-item" onclick="removeCartItem('${item.id}')" title="Remove">&times;</button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Bill Breakdown
  const bSub = document.getElementById("billSubtotal");
  const bDiscRow = document.getElementById("billDiscountRow");
  const bDisc = document.getElementById("billDiscountAmount");
  const bDel = document.getElementById("billDeliveryFee");
  const bTot = document.getElementById("billTotal");

  if (bSub) bSub.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (bDiscRow) bDiscRow.style.display = hasBulkDiscount ? "flex" : "none";
  if (bDisc) bDisc.textContent = `-₹${discountAmount.toLocaleString('en-IN')}`;
  if (bDel) bDel.textContent = "Confirmed on WhatsApp";
  if (bTot) bTot.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
  const sTot = document.getElementById("stickyBillTotal");
  if (sTot) sTot.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
  const stickyFooter = document.getElementById("cartDrawerStickyFooter");
  if (stickyFooter) stickyFooter.style.display = cart.length === 0 ? "none" : "flex";
}

function openCart() {
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  goToCartStep(1);
  if (drawer) drawer.classList.add("active");
  if (backdrop) backdrop.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  if (drawer) drawer.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

function validateCustomerDetails() {
  const nameEl = document.getElementById("custName");
  const phoneEl = document.getElementById("custPhone");
  const addrEl = document.getElementById("custAddress");
  const cityEl = document.getElementById("custCity");
  const pinEl = document.getElementById("custPincode");
  const notesEl = document.getElementById("custNotes");

  const name = nameEl ? nameEl.value.trim() : "";
  const phone = phoneEl ? phoneEl.value.trim() : "";
  const address = addrEl ? addrEl.value.trim() : "";
  const city = cityEl ? cityEl.value.trim() : "";
  const pincode = pinEl ? pinEl.value.trim() : "";
  const notes = notesEl ? notesEl.value.trim() : "";

  let hasError = false;

  // Name validation
  if (!name || name.length < 2) {
    if (nameEl) nameEl.classList.add("form-input-error");
    hasError = true;
  } else {
    if (nameEl) nameEl.classList.remove("form-input-error");
  }

  // Phone validation (10 digits)
  const phoneDigits = phone.replace(/[^0-9]/g, "");
  if (!phone || phoneDigits.length !== 10) {
    if (phoneEl) phoneEl.classList.add("form-input-error");
    hasError = true;
  } else {
    if (phoneEl) phoneEl.classList.remove("form-input-error");
  }

  if (hasError) {
    // Open accordion if collapsed
    const form = document.getElementById("deliveryForm");
    if (form && form.style.display === "none") {
      form.style.display = "flex";
      const arrow = document.getElementById("accordionArrow");
      if (arrow) arrow.textContent = "▲";
    }
    showToast("Please enter your Name and 10-digit WhatsApp phone number to proceed.");
    if (!name || name.length < 2) {
      if (nameEl) nameEl.focus();
    } else {
      if (phoneEl) phoneEl.focus();
    }
    return null;
  }

  const customerData = { name, phone, address, city, pincode, notes };
  return customerData;
}

function proceedToWhatsAppCheckout() {
  if (cart.length === 0) {
    showToast("Your shopping bag is empty! Browse 8 designs to add items.");
    return;
  }

  const customer = validateCustomerDetails();
  if (!customer) return;

  const btn = document.getElementById("proceedWhatsAppOrderBtn");
  const label = document.getElementById("proceedBtnLabel");
  const origText = label ? label.textContent : "";
  if (btn) btn.disabled = true;
  if (label) label.textContent = "Opening WhatsApp...";

  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const discountAmount = totalItems >= 10 ? Math.round(subtotal * 0.05) : 0;
  const totalPayable = subtotal - discountAmount;

  // Order Reference Number
  const orderRef = "RUP-BAG-" + Math.floor(1000 + Math.random() * 9000);

  let msg = `🌿 *FULL BAG ORDER — RUPANTAR* 🌿\n`;
  msg += `*Reference:* #${orderRef}\n\n`;

  msg += `👤 *CUSTOMER DETAILS:*\n`;
  msg += `• Name: ${customer.name}\n`;
  const custCode = document.getElementById("custCountryCode") ? document.getElementById("custCountryCode").value : "+91";
  msg += `• WhatsApp: ${custCode} ${customer.phone}\n`;
  if (customer.address || customer.city) {
    msg += `• Delivery Address: ${[customer.address, customer.city, customer.pincode].filter(Boolean).join(", ")}\n`;
  } else {
    msg += `• Delivery Address: (Will share directly in this WhatsApp chat)\n`;
  }
  if (customer.notes) {
    msg += `• Customisation / Gifting Instructions: "${customer.notes}"\n`;
  }
  msg += `\n📦 *DIARIES IN BAG (${totalItems} ${totalItems === 1 ? 'item' : 'items'}):*\n`;

  cart.forEach((item, index) => {
    msg += `${index + 1}. *${item.designNumber ? item.designNumber + ' — ' : ''}${item.name}*\n`;
    msg += `   • Spec: ${item.size || '10x14 cm'}, ${item.pages || 10} Pages (Rice Husk)\n`;
    if (item.customisation) {
      msg += `   • Customisation: "${item.customisation}"\n`;
    }
    msg += `   • Qty: ${item.quantity} × ₹${item.price} = ₹${item.price * item.quantity}\n\n`;
  });

  msg += `💰 *BILL SUMMARY:*\n`;
  msg += `• Items Subtotal: ₹${subtotal.toLocaleString('en-IN')} (${totalItems} ${totalItems === 1 ? 'diary' : 'diaries'})\n`;
  if (discountAmount > 0) {
    msg += `• 5% Discount (10+ books): -₹${discountAmount.toLocaleString('en-IN')}\n`;
  }
  msg += `• Shipping: Confirmed on WhatsApp based on location\n`;
  msg += `• *TOTAL PAYABLE: ₹${totalPayable.toLocaleString('en-IN')}*\n\n`;
  msg += `Hi Team Rupantar! I would like to order my shopping bag. Please confirm paper stock availability, delivery timeline, and share payment details (UPI/QR). Thank you! 🙏`;

  const cleanNumber = (currentConfig.whatsappNumber || "919876543210").replace(/[^0-9]/g, "");
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;

  lastWhatsAppOrderUrl = url;
  lastWhatsAppOrderText = msg;

  window.open(url, "_blank");

  setTimeout(() => {
    if (btn) btn.disabled = false;
    if (label) label.textContent = origText || "💬 Send Full Bag to WhatsApp →";
    closeCart();
    openOrderConfirmationModal();
  }, 400);
}

function copyOrderTextToClipboard() {
  if (cart.length === 0) {
    showToast("Bag is empty!");
    return;
  }
  const customer = validateCustomerDetails() || {
    name: "Customer",
    phone: "Provided on WhatsApp",
    address: "Provided on WhatsApp",
    city: "",
    pincode: ""
  };
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const deliveryFee = subtotal >= (currentConfig.freeDeliveryThreshold || 799) ? 0 : (currentConfig.deliveryFee || 60);

  let msg = `🌿 *BAG ORDER — RUPANTAR* 🌿\n\n`;
  cart.forEach((i, idx) => {
    msg += `${idx + 1}. ${i.name} (${i.size}, ${i.pages} pgs) × ${i.quantity} = ₹${i.price * i.quantity}\n`;
  });
  msg += `\nTotal: ₹${subtotal + deliveryFee}\nCustomer: ${customer.name} (${customer.phone})`;

  fallbackCopyText(msg);
}

function clearCustomerFormInputs() {
  const fields = [
    "custName", "custPhone", "custAddress", "custCity", "custPincode", "custNotes",
    "qbCustName", "qbCustPhone", "qbCustCity", "qbCustAddress", "qbCustCustomization"
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  try {
    localStorage.removeItem("rupaantar_customer_info");
  } catch(e) {}
}

function loadSavedCustomerInfo() {
  clearCustomerFormInputs();
}

/* ==========================================================================
   Store Sharing & Broadcast Links
   ========================================================================== */
function getStoreBaseUrl() {
  return window.location.origin + window.location.pathname;
}

function getStoreShareBroadcastMessage() {
  const storeUrl = getStoreBaseUrl();
  return `🌿 *Discover Rupantar — Handcrafted Folk-Art Diaries* 🌾\n\nMade from sustainable earthy rice husk paper with spiral ring binding that lies 180° flat.\n\n🎨 Browse all 8 Indian folk-art covers:\n👉 ${storeUrl}\n\nTap the link to explore covers, choose your page count, and place orders directly on WhatsApp! ✨`;
}

function openShareStoreModal() {
  const preview = document.getElementById("shareWhatsAppMessagePreview");
  if (preview) {
    preview.textContent = getStoreShareBroadcastMessage();
  }
  const backdrop = document.getElementById("shareStoreModalBackdrop");
  if (backdrop) backdrop.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeShareStoreModal() {
  const backdrop = document.getElementById("shareStoreModalBackdrop");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
}

function sendStoreOnWhatsApp() {
  const msg = getStoreShareBroadcastMessage();
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  closeShareStoreModal();
  showToast("Opening WhatsApp to share store!");
}

function copyStoreAnnouncementToClipboard() {
  const msg = getStoreShareBroadcastMessage();
  fallbackCopyText(msg);
}

function copyStoreLinkToClipboard() {
  fallbackCopyText(getStoreBaseUrl());
}

function shareProductDirect(productId) {
  const product = currentCatalogue.find(p => p.id === productId);
  if (!product) return;
  const storeUrl = getStoreBaseUrl();
  const directLink = `${storeUrl}?design=${product.designNumber}`;
  fallbackCopyText(directLink);
  showToast(`Copied direct link for Design ${product.designNumber}!`);
}

function checkUrlDeepLinks() {
  try {
    const params = new URLSearchParams(window.location.search);
    const design = params.get("design");
    if (design) {
      const match = currentCatalogue.find(p => p.designNumber === design || p.id === design || p.id === `aaroh-${design}`);
      if (match) {
        setTimeout(() => {
          openQuickBuyModal(match.id);
        }, 300);
      }
    }
  } catch(e) {}
}

/* ==========================================================================
   Event Listeners & Helpers
   ========================================================================== */
function initEventListeners() {
  // Search input & clear button
  const searchInput = document.getElementById("searchInput") || document.getElementById("searchCatalogInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery.length > 0 ? "block" : "none";
      }
      renderCatalogue();
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      clearSearchBtn.style.display = "none";
      searchQuery = "";
      renderCatalogue();
    });
  }

  // Settings Modal triggers
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  if (openSettingsBtn) openSettingsBtn.addEventListener("click", openSettingsModal);

  const closeSettingsBtn = document.getElementById("closeSettingsModalBtn");
  if (closeSettingsBtn) closeSettingsBtn.addEventListener("click", closeSettingsModal);

  const settingsBackdrop = document.getElementById("settingsModalBackdrop");
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", (e) => {
      if (e.target === settingsBackdrop) closeSettingsModal();
    });
  }

  const settingsForm = document.getElementById("storeSettingsForm");
  if (settingsForm) settingsForm.addEventListener("submit", handleSaveSettings);

  const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");
  if (resetDefaultsBtn) resetDefaultsBtn.addEventListener("click", handleResetDefaults);

  // Share store modal backdrop click
  const shareBackdrop = document.getElementById("shareStoreModalBackdrop");
  if (shareBackdrop) {
    shareBackdrop.addEventListener("click", (e) => {
      if (e.target === shareBackdrop) closeShareStoreModal();
    });
  }

  // Cart Drawer triggers
  const openCartBtn = document.getElementById("openCartBtn");
  if (openCartBtn) openCartBtn.addEventListener("click", openCart);

  const closeCartBtn = document.getElementById("closeCartDrawerBtn");
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);

  const cartBackdrop = document.getElementById("cartBackdrop");
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);

  // Quick Buy close triggers
  const closeQb = document.getElementById("closeQuickBuyModalBtn");
  if (closeQb) closeQb.addEventListener("click", closeQuickBuyModal);

  const qbBackdrop = document.getElementById("quickBuyModalBackdrop");
  if (qbBackdrop) {
    qbBackdrop.addEventListener("click", (e) => {
      if (e.target === qbBackdrop) closeQuickBuyModal();
    });
  }

  // Checkout button
  const checkoutBtn = document.getElementById("proceedWhatsAppOrderBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", proceedToWhatsAppCheckout);

  const copyBagBtn = document.getElementById("copyOrderTextBtn");
  if (copyBagBtn) copyBagBtn.addEventListener("click", copyOrderTextToClipboard);

  // Keyboard escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeQuickBuyModal();
      closeCart();
      closeShareStoreModal();
      closeOrderConfirmationModal();
      closeSettingsModal();
    }
  });
}

function fallbackCopyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied to clipboard! 📋");
    }).catch(() => {
      prompt("Copy to clipboard: Ctrl+C, Enter", text);
    });
  } else {
    prompt("Copy to clipboard: Ctrl+C, Enter", text);
  }
}

function showToast(msg) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2800);
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* Store & WhatsApp Settings Modal Implementation */
function openSettingsModal() {
  const backdrop = document.getElementById("settingsModalBackdrop");
  if (!backdrop) return;
  const nameInput = document.getElementById("settingStoreName");
  const phoneInput = document.getElementById("settingWhatsAppNum");
  const feeInput = document.getElementById("settingDeliveryFee");
  const thresholdInput = document.getElementById("settingFreeThreshold");
  if (nameInput) nameInput.value = currentConfig.storeName || "Rupantar";
  if (phoneInput) phoneInput.value = currentConfig.whatsappNumber || "919876543210";
  if (feeInput) feeInput.value = currentConfig.deliveryFee !== undefined ? currentConfig.deliveryFee : 60;
  if (thresholdInput) thresholdInput.value = currentConfig.freeDeliveryThreshold !== undefined ? currentConfig.freeDeliveryThreshold : 799;
  backdrop.classList.add("active");
}

function closeSettingsModal() {
  const backdrop = document.getElementById("settingsModalBackdrop");
  if (backdrop) backdrop.classList.remove("active");
}

function handleSaveSettings(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById("settingStoreName");
  const phoneInput = document.getElementById("settingWhatsAppNum");
  const feeInput = document.getElementById("settingDeliveryFee");
  const thresholdInput = document.getElementById("settingFreeThreshold");

  const rawPhone = phoneInput ? phoneInput.value.trim() : "";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");

  if (!isValidWhatsAppNumber(cleanPhone)) {
    showToast("⚠️ Please enter a valid 10-15 digit WhatsApp number with country code (e.g. 919876543210).");
    return;
  }

  const updated = saveStoreConfig({
    storeName: nameInput ? (nameInput.value.trim() || "Rupantar") : "Rupantar",
    whatsappNumber: cleanPhone,
    whatsappDisplayNumber: cleanPhone.startsWith("91") && cleanPhone.length === 12
      ? `+91 ${cleanPhone.slice(2, 7)} ${cleanPhone.slice(7)}`
      : `+${cleanPhone}`,
    deliveryFee: feeInput ? (parseInt(feeInput.value, 10) || 0) : 60,
    freeDeliveryThreshold: thresholdInput ? (parseInt(thresholdInput.value, 10) || 799) : 799
  });

  currentConfig = updated;

  // Refresh visible UI
  const navTitle = document.getElementById("navStoreName");
  if (navTitle) navTitle.textContent = currentConfig.storeName;

  const footerLink = document.getElementById("footerWhatsAppLink");
  if (footerLink) {
    footerLink.href = getWhatsAppUrl("Hi " + currentConfig.storeName + "! I am inquiring about handcrafted folk-art diaries.");
    footerLink.textContent = currentConfig.whatsappDisplayNumber || currentConfig.whatsappNumber;
  }

  const floatBtn = document.getElementById("floatingWhatsAppBtn");
  if (floatBtn) {
    floatBtn.href = getWhatsAppUrl("Hi " + currentConfig.storeName + "! I am browsing the folk-art diaries collection.");
  }

  updateCartUI();
  showToast("Store settings saved! ⚙️ WhatsApp orders routed to " + currentConfig.whatsappNumber);
  closeSettingsModal();
}

function handleResetDefaults() {
  currentConfig = resetStoreConfig();
  const navTitle = document.getElementById("navStoreName");
  if (navTitle) navTitle.textContent = currentConfig.storeName;
  updateCartUI();
  showToast("Store settings reset to defaults. 🔄");
  closeSettingsModal();
}


/* ==========================================================================
   2-STEP CHECKOUT CONTROLLERS (QUICK BUY & CART)
   Step 1: Confirmation of Quantity & Type
   Step 2: Address & Details
   ========================================================================== */

let currentQuickBuyStep = 1;
let currentCartStep = 1;

function goToQuickBuyStep(step) {
  currentQuickBuyStep = step;
  const view1 = document.getElementById("qbStep1View");
  const view2 = document.getElementById("qbStep2View");
  const pill1 = document.getElementById("qbStep1Pill");
  const pill2 = document.getElementById("qbStep2Pill");

  if (step === 2) {
    if (view1) view1.style.display = "none";
    if (view2) view2.style.display = "block";
    if (pill1) { pill1.classList.remove("active"); pill1.classList.add("completed"); }
    if (pill2) { pill2.classList.add("active"); }

    // Update Step 2 Summary Banner
    if (qbProduct) {
      const titleEl = document.getElementById("qbStep2SummaryTitle");
      const specsEl = document.getElementById("qbStep2SummarySpecs");
      const totalEl = document.getElementById("qbStep2TotalAmountDisplay");
      
      const sizeObj = PRICING_MATRIX[qbSize] || PRICING_MATRIX["10x14"];
      const baseUnitPrice = getPriceForSpec(qbSize, qbPages);
      const subtotal = baseUnitPrice * qbQty;
      const hasBulkDiscount = qbQty >= 10;
      const discountAmount = hasBulkDiscount ? Math.round(subtotal * 0.05) : 0;
      const total = subtotal - discountAmount;

      if (titleEl) titleEl.textContent = `${qbProduct.designNumber}. ${qbProduct.name}`;
      if (specsEl) specsEl.textContent = `${sizeObj.dimensions} • ${qbPages} pgs • Qty: ${qbQty}${hasBulkDiscount ? ' (5% Off)' : ''}`;
      if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
  } else {
    if (view1) view1.style.display = "block";
    if (view2) view2.style.display = "none";
    if (pill1) { pill1.classList.add("active"); pill1.classList.remove("completed"); }
    if (pill2) { pill2.classList.remove("active"); pill2.classList.remove("completed"); }
  }
}

function goToCartStep(step) {
  if (step === 2 && cart.length === 0) {
    showToast("Your shopping bag is empty! Add books to proceed.");
    return;
  }
  
  currentCartStep = step;
  const view1 = document.getElementById("cartStep1View");
  const view2 = document.getElementById("cartStep2View");
  const pill1 = document.getElementById("cartStep1Pill");
  const pill2 = document.getElementById("cartStep2Pill");

  if (step === 2) {
    if (view1) view1.style.display = "none";
    if (view2) view2.style.display = "block";
    if (pill1) { pill1.classList.remove("active"); pill1.classList.add("completed"); }
    if (pill2) { pill2.classList.add("active"); }

    // Update Step 2 Cart Summary
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const discountAmount = totalItems >= 10 ? Math.round(subtotal * 0.05) : 0;
    const finalTotal = subtotal - discountAmount;

    const countEl = document.getElementById("cartStep2ItemsCount");
    const totalEl = document.getElementById("cartStep2TotalPreview");
    if (countEl) countEl.textContent = `${totalItems} ${totalItems === 1 ? 'diary' : 'diaries'} in Bag`;
    if (totalEl) totalEl.textContent = `Total: ₹${finalTotal.toLocaleString('en-IN')}${discountAmount > 0 ? ' (incl. 5% off)' : ''}`;
  } else {
    // Step 1
    if (view1) view1.style.display = "block";
    if (view2) view2.style.display = "none";
    if (pill1) { pill1.classList.add("active"); pill1.classList.remove("completed"); }
    if (pill2) { pill2.classList.remove("active"); pill2.classList.remove("completed"); }
  }
}
