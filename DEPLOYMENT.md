# 🚀 Rupantar Mini-Store — Public Deployment Guide

This guide gives you exact, step-by-step instructions to deploy your website to the public internet so customers can browse all 8 folk-art diaries and send orders directly to your WhatsApp business number.

---

## 🏗️ Architecture & Framework Identification
- **Framework:** Vanilla HTML5, modern CSS3 (Custom Properties & Responsive Grid), and zero-dependency ES6 JavaScript.
- **Server / Runtime:** Static web client with built-in zero-dependency Node.js HTTP server (`serve.js`).
- **Ordering Mechanism:** Client-side order builder, bulk discount calculator, and URL-encoded WhatsApp click-to-chat integration (`https://wa.me/`).
- **Recommended Host:** **Vercel** (Recommended for instant global CDN, automatic SSL certificates, and zero-maintenance free static hosting). Netlify, GitHub Pages, or Cloudflare Pages are also 100% compatible.

---

## 📱 WhatsApp Business Number Configuration

Before sharing the live link with customers:
1. Open `config.js`
2. Locate:
   ```javascript
   whatsappNumber: "919876543210",
   whatsappDisplayNumber: "+91 98765 43210",
   ```
3. Replace `"919876543210"` with your actual registered WhatsApp business phone number.
   - **Format:** Country code + mobile number, digits only (no spaces, dashes, or `+` sign).
   - *Example:* For Indian number `+91 98765 43210`, enter `"919876543210"`.

---

## 🌐 Option A: Deploy to Vercel (Recommended — Takes 2 Minutes)

### Method 1: Via Vercel CLI (Fastest)
1. Open terminal in `D:\rupaantar-store`
2. Run:
   ```bash
   npm install -g vercel
   vercel
   ```
3. Follow the quick prompts:
   - *Set up and deploy?* -> `Y`
   - *Which scope?* -> Your account
   - *Link to existing project?* -> `N`
   - *Project name?* -> `rupaantar-store`
   - *Directory?* -> `./`
4. When ready for production:
   ```bash
   vercel --prod
   ```
5. You will get a live URL like: `https://rupaantar-store.vercel.app`

### Method 2: Via GitHub & Vercel Dashboard
1. Initialize Git in `D:\rupaantar-store`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Rupantar store"
   ```
2. Push to your GitHub account (private or public repository).
3. Go to [https://vercel.com/new](https://vercel.com/new)
4. Import your repository.
5. Keep Build Command empty (static site) and Output Directory as `.`.
6. Click **Deploy**.

---

## 🌍 Connecting a Custom Domain (e.g. rupaantar.in or projectrupaantar.com)

Once deployed on Vercel:
1. Open your project dashboard on Vercel.
2. Go to **Settings** ➔ **Domains**.
3. Type your domain (e.g., `rupaantar.in` or `shop.rupaantar.in`) and click **Add**.
4. Vercel will display the DNS records needed:
   - For an Apex domain (`rupaantar.in`): Add an `A` record pointing to `76.76.21.21`.
   - For a Subdomain (`www.rupaantar.in` or `shop.rupaantar.in`): Add a `CNAME` record pointing to `cname.vercel-dns.com`.
5. Once your DNS updates (usually 5-15 minutes), Vercel automatically generates a free SSL HTTPS certificate.

---

## 🧪 Post-Deployment Verification Checklist

Once the live link is active, perform this 60-second test:
1. [ ] **Homepage Load:** Confirm all 8 folk-art covers render crisply without broken image icons.
2. [ ] **Floating WhatsApp Button:** Tap the green circular WhatsApp button at bottom-right. Confirm it opens WhatsApp chat with the general enquiry prefill message.
3. [ ] **Quick Buy Modal:** Click **Quick Buy** on Design 01. Select `14x17.5 Large`, `20 Pages`, set quantity to `200`. Check that the bulk discount alert shows `-₹54/diary` savings.
4. [ ] **Place Order on WhatsApp:** Enter your name and phone, click **Order on WhatsApp**.
   - Verify that WhatsApp Web or app opens with the complete prefilled order message.
   - Verify that the website displays the Next-Step confirmation dialog reminding the customer to hit **Send**.
5. [ ] **Direct Share Link:** Copy direct link for Design 01 (`?design=01`) and open in an incognito tab. Verify it deep-links directly into that diary.

---

## ℹ️ Important Technical Notes & Honest Disclaimers
- **WhatsApp Click-to-Chat Delivery:** WhatsApp click-to-chat prepares and pre-fills the message directly into the customer's chat with your business. The customer must manually tap **Send** in WhatsApp to transmit the message.
- **Order Confirmation:** Orders are not recorded in a private backend database automatically; confirmation, invoice generation, and UPI QR payment collection are finalized in the WhatsApp chat between your team and the customer.
