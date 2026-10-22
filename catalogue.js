/**
 * Rupantar Product Catalogue
 * Official Rice Husk Paper Handcrafted Diaries
 * 
 * Pricing Matrix:
 * Size / Pages:
 * 10x14 cm:  10 pgs = ₹199 | 15 pgs = ₹229 | 20 pgs = ₹249
 * 14x17.5 cm: 10 pgs = ₹229 | 15 pgs = ₹249 | 20 pgs = ₹279
 * 
 * Bulk Discounts (per diary):
 * 1-9: Full price
 * 10-19: -₹10/diary
 * 20-49: -₹40/diary
 * 50+:   -₹54/diary
 */

const PRICING_MATRIX = {
  "10x14": {
    label: "10 x 14 cm (Compact)",
    dimensions: "10 x 14 cm",
    pages: {
      10: 199,
      15: 229,
      20: 249
    }
  },
  "14x17.5": {
    label: "14 x 17.5 cm (Large)",
    dimensions: "14 x 17.5 cm",
    pages: {
      10: 229,
      15: 249,
      20: 279
    }
  }
};

function getPriceForSpec(sizeKey, pages) {
  const sizeObj = PRICING_MATRIX[sizeKey] || PRICING_MATRIX["10x14"];
  return sizeObj.pages[pages] || 199;
}

function getBulkDiscountPerDiary(qty) {
  if (qty >= 50) return 54;
  if (qty >= 20) return 40;
  if (qty >= 10) return 10;
  return 0;
}

const DEFAULT_PRODUCTS = [
  {
    "id": "aaroh-01",
    "designNumber": "01",
    "name": "Aaroh Signature",
    "tagline": "The face of the AAROH collection",
    "shortDescription": "A folk-art figure framed in a gilded mandala. The face of the AAROH collection.",
    "fullDescription": "A folk-art figure framed in a gilded mandala. The face of the AAROH collection. Bound with durable spiral ring binding that lies completely flat 180° for effortless sketching and notes.",
    "tag": "Signature Cover",
    "basePrice": 199,
    "image": "assets/images/design-01.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  },
  {
    "id": "aaroh-02",
    "designNumber": "02",
    "name": "Veena & Mandala",
    "tagline": "For music and learning",
    "shortDescription": "A veena blooming into a mandala, with books and a peacock feather. For music and learning.",
    "fullDescription": "A veena blooming into a mandala, with books and a peacock feather. For music and learning. Each page of rice husk paper carries the earthy textures of nature.",
    "tag": "Folk Art",
    "basePrice": 199,
    "image": "assets/images/design-02.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  },
  {
    "id": "aaroh-03",
    "designNumber": "03",
    "name": "Rooted",
    "tagline": "Familiar patterns, reimagined",
    "shortDescription": "A turtle with a lotus shell in a patterned frame. Familiar patterns, reimagined.",
    "fullDescription": "A turtle with a lotus shell in a patterned frame. Familiar patterns, reimagined for everyday journaling on sustainable rice husk sheets.",
    "tag": "Symbol of Longevity",
    "basePrice": 199,
    "image": "assets/images/design-03.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  },
  {
    "id": "aaroh-04",
    "designNumber": "04",
    "name": "Warli Circle",
    "tagline": "Folk rhythm on every page",
    "shortDescription": "Warli dancers in a circular mandala on earthy brown. Folk rhythm on every page.",
    "fullDescription": "Warli dancers in a circular celebratory mandala on earthy brown. Represents community harmony and folk rhythm, bound with spiral spine.",
    "tag": "Traditional Warli",
    "basePrice": 199,
    "image": "assets/images/design-04.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  },
  {
    "id": "aaroh-05",
    "designNumber": "05",
    "name": "Details",
    "tagline": "Fine lines and layered patterns",
    "shortDescription": "A Gond-style peacock among flowering branches. Fine lines and layered patterns.",
    "fullDescription": "A Gond-style peacock among flowering branches. Fine lines and layered patterns printed on natural kraft cover with rice husk interior pages.",
    "tag": "Gond Style",
    "basePrice": 199,
    "image": "assets/images/design-05.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  },
  {
    "id": "aaroh-06",
    "designNumber": "06",
    "name": "Tree of Life Deer",
    "tagline": "Folk-art style on kraft cover",
    "shortDescription": "Deer carrying a tree of life, in folk-art style on a kraft cover.",
    "fullDescription": "Deer carrying a blossoming tree of life on its antlers. A timeless symbol of growth and resilience from Indian tribal folklore.",
    "tag": "Tree of Life",
    "basePrice": 199,
    "image": "assets/images/design-06.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  },
  {
    "id": "aaroh-07",
    "designNumber": "07",
    "name": "Made to Keep",
    "tagline": "For memories, ideas and everything in between",
    "shortDescription": "Intricate peacock line art for memories, ideas and everything in between.",
    "fullDescription": "Intricate peacock line art for memories, ideas and everything in between. Handcrafted with spiral binding and earth-friendly rice husk paper.",
    "tag": "Line Art",
    "basePrice": 199,
    "image": "assets/images/design-07.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  },
  {
    "id": "aaroh-08",
    "designNumber": "08",
    "name": "Culture",
    "tagline": "Tradition on every cover",
    "shortDescription": "Twin floral mandalas in terracotta and green. Tradition on every cover.",
    "fullDescription": "Twin floral mandalas in vibrant terracotta and leaf green. Tradition on every cover, printed on sturdy board with rice husk pages.",
    "tag": "Mandala Art",
    "basePrice": 199,
    "image": "assets/images/design-08.png",
    "specs": {
      "paper": "Sustainable Earthy Rice Husk Paper",
      "binding": "Spiral Bound (Lies flat, easy to write and flip)",
      "sizesAvailable": "10 x 14 cm (Compact) & 14 x 17.5 cm (Large)",
      "pageOptions": "10 / 15 / 20 pages"
    }
  }
];

function getProductCatalogue() {
  return DEFAULT_PRODUCTS;
}

if (typeof module !== 'undefined') {
  module.exports = {
    PRICING_MATRIX,
    DEFAULT_PRODUCTS,
    getPriceForSpec,
    getBulkDiscountPerDiary,
    getProductCatalogue
  };
}
