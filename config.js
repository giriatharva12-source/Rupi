/**
 * Rupantar — Store Configuration
 *
 * Single source of truth for business details, WhatsApp routing, and store policies.
 */

const DEFAULT_CONFIG = {
  storeName: "Rupaantar",
  tagline: "An ode to India, reimagined.",
  subtext: "Handcrafted spiral-bound diaries made from sustainable rice husk paper.",
  instagramHandle: "@projectrupaantar",
  instagramUrl: "https://www.instagram.com/projectrupaantar?mdxt=MXF5NGM0cGJ6M2p3Nw==",

  /**
   * Official Rupaantar Business WhatsApp Number:
   * Format: International format, country code included, digits only (NO '+' sign, spaces, or dashes).
   * Example for India (+91 98765 43210): "919876543210"
   *
   * NOTE FOR PRODUCTION DEPLOYMENT:
   * Replace this placeholder with Rupaantar's official registered WhatsApp business number.
   */
  whatsappNumber: "919876543210",
  whatsappDisplayNumber: "+91 98765 43210",

  currencySymbol: "₹",
  currencyCode: "INR",

  // Delivery Rules
  deliveryFee: 60,
  freeDeliveryThreshold: 799,
  estimatedDeliveryTime: "3 - 5 Business Days",
  shippingPolicyNote:
    "Standard delivery: ₹60 (Free on orders above ₹799). Bulk orders (50+ diaries) shipping confirmed via WhatsApp based on weight and destination.",

  features: [
    { icon: "🌾", title: "Rice Husk Paper", desc: "Sustainable, earthy, natural texture" },
    { icon: "🎨", title: "Folk-Art Covers", desc: "Tradition reimagined by Indian artisans" },
    { icon: "📖", title: "Spiral Bound", desc: "Lies flat 180°, easy to write and flip" },
    { icon: "✨", title: "Bulk & Custom Editions", desc: "Discounts up to ₹54 off for teams & events" }
  ]
};

/**
 * Validates whether the WhatsApp number is properly configured
 * @param {string} num
 * @returns {boolean}
 */
function isValidWhatsAppNumber(num) {
  if (!num) return false;
  const digitsOnly = String(num).replace(/[^0-9]/g, "");
  // International phone numbers are typically 10 to 15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Returns formatted WhatsApp click-to-chat URL
 * @param {string} message
 * @param {string} [customNumber]
 * @returns {string}
 */
function getWhatsAppUrl(message, customNumber) {
  const cfg = getStoreConfig();
  const num = (customNumber || cfg.whatsappNumber || "").replace(/[^0-9]/g, "");
  return "https://wa.me/" + num + "?text=" + encodeURIComponent(message);
}

function getStoreConfig() {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("rupaantar_store_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeName === "Rupantar") parsed.storeName = "Rupaantar";
        return { ...DEFAULT_CONFIG, ...parsed };
      } catch (e) {
        console.warn("Could not parse saved config", e);
      }
    }
  }
  return DEFAULT_CONFIG;
}

function saveStoreConfig(newConfig) {
  const merged = { ...getStoreConfig(), ...newConfig };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("rupaantar_store_config", JSON.stringify(merged));
  }
  return merged;
}

function resetStoreConfig() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("rupaantar_store_config");
  }
  return DEFAULT_CONFIG;
}

if (typeof module !== "undefined") {
  module.exports = {
    DEFAULT_CONFIG,
    isValidWhatsAppNumber,
    getWhatsAppUrl,
    getStoreConfig,
    saveStoreConfig,
    resetStoreConfig
  };
}
