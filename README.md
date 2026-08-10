# Jay Shakti Hardware & Electronics — Business Website

A complete, modern business website for a Hardware & Electronics shop, built from
the branding/posters/images you provided. It includes a product catalogue,
customer enquiry system, WhatsApp integration, and a full admin panel.

---

## 1. Project Structure

```
jay-shakti-website/
├── server.js                 # App entry point
├── config.js                 # Central config: business info, WhatsApp number, theme colors
├── .env.example               # Copy to .env and fill in your real details
├── package.json
│
├── db/
│   ├── database.js           # SQLite connection + schema + default admin creation
│   └── seed.js                # Seeds starter categories/products using your uploaded images
│
├── routes/
│   ├── public.js              # Home, Products, Product Detail, About, Contact, Enquiry submit
│   └── admin.js                # Admin login, dashboard, product/category CRUD, enquiries
│
├── middleware/
│   ├── auth.js                 # requireAdmin session guard
│   └── upload.js               # Multer image upload config
│
├── utils/
│   └── helpers.js              # slugify() + WhatsApp deep-link builder
│
├── views/                      # EJS templates
│   ├── partials/               # head, navbar, footer, admin-nav
│   ├── home.ejs, products.ejs, product-detail.ejs, about.ejs, contact.ejs, 404.ejs
│   └── admin/                  # login, dashboard, products, product-form, categories, enquiries, enquiry-detail
│
└── public/
    ├── css/style.css           # Public site styles
    ├── css/admin.css           # Admin panel styles
    ├── js/main.js, products.js # Nav toggle, scroll animations, live search
    ├── uploads/                 # Images uploaded via the Admin Panel land here
    └── assets/                  # Your uploaded images, organized:
        ├── logo/                 # Business logo
        ├── banners/               # Wide poster images → used for hero/promo banners
        ├── posters/                # Portrait poster images → used for categories/products
        └── products/               # Square product photos
```

### A note on the image organization
Your ZIP contained photos and posters without filenames indicating what each one
was. I sorted them automatically by shape (square → products, wide → banners,
tall → posters) and used them to seed the homepage, category tiles and sample
products. **Please review `/admin/products` and `/admin/categories` once the site
is running** and swap in the exact images/captions you want — everything is fully
editable there, no code changes required.

---

## 2. Technologies Used

- **Backend:** Node.js + Express
- **Templating:** EJS (server-rendered, fast, SEO-friendly HTML)
- **Database:** SQLite via `better-sqlite3` (file-based, zero setup, easy to back up)
- **Auth:** `express-session` + `bcryptjs` for admin login
- **File uploads:** `multer` for product/category images
- **Frontend:** Hand-written responsive CSS (no framework bloat) + vanilla JS
- **No build step** — just `npm install` and run

---

## 3. Features Implemented

**Public site**
- Home page: hero banner, business highlights, category tiles, featured products,
  promotional banner, Why Choose Us, About preview, enquiry CTA, contact info, footer
- Products catalogue: category filter, live search, "Get Best Price" (no prices shown by default)
- Product detail page: large image, description, specifications, quantity, enquiry form, WhatsApp button
- About Us page (editable placeholder sections where info wasn't provided)
- Contact page: business info, contact form, WhatsApp/phone/email links, Maps placeholder
- WhatsApp buttons everywhere — pre-filled with product name, quantity and message
- Fully responsive (mobile / tablet / laptop / desktop) with mobile nav menu
- SEO: page titles, meta descriptions, Open Graph tags, image alt text, clean URLs

**Enquiry system**
- Enquiries (from contact form or product page) are stored in the database
- Each enquiry: name, mobile, email, product, quantity, message, status, timestamp

**Admin panel** (`/admin`)
- Secure login (bcrypt-hashed password, session-based)
- Dashboard with stats + recent enquiries
- Products: add / edit / delete, image upload or image path, featured toggle, availability
- Categories: add / delete, with image
- Enquiries: view all, filter by status, view details, update status
  (New → Contacted → In Progress → Completed), one-click WhatsApp reply

---

## 4. How to Run Locally

**Requirements:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
cd jay-shakti-website
npm install

# 2. Configure your business details
cp .env.example .env
# then edit .env: business name, address, phone, WHATSAPP_NUMBER, etc.

# 3. Seed starter categories & sample products (uses your uploaded images)
npm run seed

# 4. Start the server
npm start
```

Then open:
- Website: **http://localhost:3000**
- Admin panel: **http://localhost:3000/admin/login**
  - Default login → username: `admin`, password: `JayShakti@123`
  - **Change this password** by editing `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`
    *before* the first run (the default admin account is only created once,
    the first time the database is created). If you already ran it once, delete
    `db/jayshakti.db*` and restart to regenerate with new credentials.

For development with auto-restart on file changes: `npm run dev`

---

## 5. How to Add Products

1. Log in to `/admin`
2. Go to **Products → + Add Product**
3. Fill in name, category, description, specifications (separate each spec with `|`),
   availability, and mark "Featured" if it should appear on the homepage
4. Upload an image file, or paste a path to one of the images already in
   `public/assets/...` (e.g. `/assets/products/product-2.jpeg`)
5. Save — it appears instantly on the live Products page

Categories can be managed the same way under **Categories**.

---

## 6. How to Manage Enquiries

1. Go to **Enquiries** in the admin sidebar
2. Filter by status (New / Contacted / In Progress / Completed) using the tabs
3. Click **View** on any enquiry to see full details
4. Update its status as you follow up
5. Click **Message on WhatsApp** to open a chat directly with that customer

---

## 7. Required Environment Variables

All are optional (sensible defaults exist) but you should set at least the
business and WhatsApp details in `.env`:

| Variable | Purpose |
|---|---|
| `PORT` | Port to run the server on (default 3000) |
| `BUSINESS_NAME`, `BUSINESS_SHORT_NAME`, `BUSINESS_TAGLINE`, `BUSINESS_DESCRIPTION` | Shown across the site |
| `BUSINESS_ADDRESS`, `BUSINESS_PHONE`, `BUSINESS_EMAIL`, `BUSINESS_HOURS` | Contact page & footer |
| `WHATSAPP_NUMBER` | **Digits only, country code first, no `+` or spaces** e.g. `919824684068` — used for every WhatsApp button on the site |
| `MAP_EMBED_URL` | A Google Maps "embed" URL for the Contact page map |
| `THEME_PRIMARY`, `THEME_ACCENT` (+ dark variants) | Re-theme the whole site's colors instantly |
| `SESSION_SECRET` | Long random string — required for secure admin sessions in production |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin login (only used the very first time the database is created) |

---

## 8. Deployment Instructions

This is a standard Node.js app and can be deployed anywhere that runs Node:

**Option A — VPS / your own server (Railway, Render, DigitalOcean, etc.)**
1. Push the project to a Git repository
2. On the host, set the environment variables from `.env.example` in the platform's dashboard
3. Build/start command: `npm install && npm run seed && npm start`
   (only run `npm run seed` on the very first deploy, or once you've added your own real
   products from the admin panel you can skip it on future deploys)
4. Make sure the `public/uploads` and `db/` folders are on **persistent storage** — some
   platforms wipe the filesystem on redeploy, which would delete uploaded images and the
   database. Use a persistent volume/disk if your host supports one (Railway volumes,
   Render persistent disks, a VPS's normal disk, etc.)
5. Point your domain to the host and enable HTTPS (most platforms do this automatically)

**Option B — Traditional shared hosting with Node support**
1. Upload the project files (excluding `node_modules`)
2. Run `npm install --production` on the server
3. Use a process manager like `pm2` to keep it running: `pm2 start server.js --name jay-shakti`
4. Configure your host's reverse proxy (e.g. Nginx) to forward your domain to the app's port

**Before going live:**
- [ ] Set a strong, unique `SESSION_SECRET`
- [ ] Change the default admin password
- [ ] Fill in real business details and WhatsApp number in `.env`
- [ ] Replace/verify all seeded product & category images from the Admin Panel
- [ ] Add your real Google Maps embed URL
- [ ] Test the enquiry form, WhatsApp buttons, and admin login end-to-end
