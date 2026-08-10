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
│   ├── database.js           # Turso/libsql connection + schema + default admin creation
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
- **Database:** SQLite via `@libsql/client` — supports both [Turso](https://turso.tech) cloud (production) and local SQLite file (development)
- **Auth:** `express-session` + `bcryptjs` for admin login
- **File uploads:** `multer` for product/category images
- **Frontend:** Hand-written responsive CSS (no framework bloat) + vanilla JS
- **Containerised:** Dockerfile included for easy deployment
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

### Option A — With Docker (recommended)

**Requirements:** Docker Desktop.

```bash
# 1. Configure your business details
cp .env.example .env
# then edit .env: business name, address, phone, WHATSAPP_NUMBER, etc.

# 2. Build the Docker image
docker build -t jay-shakti-website .

# 3. Run the container
docker run -d --name jay-shakti -p 3000:3000 --env-file .env \
  -v jay-shakti-data:/app/db \
  -v jay-shakti-uploads:/app/public/uploads \
  jay-shakti-website

# 4. (Optional) Seed sample categories & products
docker exec jay-shakti node db/seed.js
```

### Option B — Without Docker

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

For development with auto-restart on file changes: `npm run dev`

### Access the site

- Website: **http://localhost:3000**
- Admin panel: **http://localhost:3000/admin/login**
  - Default login → username: `admin`, password: `JayShakti@123`
  - **Change this password** by editing `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`
    *before* the first run (the default admin account is only created once,
    the first time the database is created). If you already ran it once, delete
    `db/jayshakti.db*` and restart to regenerate with new credentials.

### Useful Docker commands

```bash
docker logs jay-shakti          # View logs
docker stop jay-shakti           # Stop the container
docker start jay-shakti          # Restart the container
docker rm -f jay-shakti          # Remove the container
```

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
business, WhatsApp, and database details in `.env`:

| Variable | Purpose |
|---|---|
| `TURSO_DATABASE_URL` | Turso cloud database URL (e.g. `libsql://your-db.turso.io`). Leave blank for local SQLite file |
| `TURSO_AUTH_TOKEN` | Turso auth token. Leave blank for local development |
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

### Option A — Render + Turso (recommended, free tier)

This is the easiest way to deploy with persistent data at no cost.

**1. Set up Turso (cloud database)**
1. Sign up at [turso.tech](https://turso.tech) (free tier: 9 GB storage)
2. Install the CLI: `npm install -g turso`
3. Create a database:
   ```bash
   turso db create jay-shakti
   turso db show jay-shakti --url        # copy the URL
   turso db tokens create jay-shakti     # copy the token
   ```

**2. Deploy on Render**
1. Push the project to GitHub
2. Go to [render.com](https://render.com) → **New+ → Web Service** → connect your repo
3. Settings:
   - **Runtime:** Docker
   - **Instance Type:** Free
4. Add environment variables:
   - `TURSO_DATABASE_URL` — the URL from step 1
   - `TURSO_AUTH_TOKEN` — the token from step 1
   - `SESSION_SECRET` — a long random string
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — your admin credentials
   - All other business details from `.env.example`
5. Click **Create Web Service** — your site will be live!

> **Note:** File uploads (product images via multer) still use local disk and
> will reset on Render's free tier. For persistent images, consider using
> Cloudinary or AWS S3.

### Option B — Docker on a VPS (DigitalOcean, AWS, etc.)

```bash
# Build and run with persistent volumes
docker build -t jay-shakti-website .
docker run -d --name jay-shakti -p 3000:3000 --env-file .env \
  -v jay-shakti-data:/app/db \
  -v jay-shakti-uploads:/app/public/uploads \
  jay-shakti-website
```

### Option C — Traditional shared hosting with Node support
1. Upload the project files (excluding `node_modules`)
2. Run `npm install --production` on the server
3. Use a process manager like `pm2` to keep it running: `pm2 start server.js --name jay-shakti`
4. Configure your host's reverse proxy (e.g. Nginx) to forward your domain to the app's port

### Before going live
- [ ] Set a strong, unique `SESSION_SECRET`
- [ ] Change the default admin password
- [ ] Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for cloud database
- [ ] Fill in real business details and WhatsApp number in `.env`
- [ ] Replace/verify all seeded product & category images from the Admin Panel
- [ ] Add your real Google Maps embed URL
- [ ] Test the enquiry form, WhatsApp buttons, and admin login end-to-end
