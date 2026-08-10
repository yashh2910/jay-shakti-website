const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const config = require('../config');
const settingsService = require('../services/settingsService');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { slugify, isValidEmail, isValidPhone, isValidUrl, sanitizeInput, DAY_ORDER } = require('../utils/helpers');

router.use((req, res, next) => {
  res.locals.business = settingsService.getSettings();
  const p = req.path;
  if (p === '/' ) res.locals.currentPage = 'dashboard';
  else if (p.startsWith('/products')) res.locals.currentPage = 'products';
  else if (p.startsWith('/categories')) res.locals.currentPage = 'categories';
  else if (p.startsWith('/enquiries')) res.locals.currentPage = 'enquiries';
  else if (p.startsWith('/settings')) res.locals.currentPage = 'settings';
  else res.locals.currentPage = '';
  next();
});

// ---------- LOGIN ----------
router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await db.execute({
    sql: 'SELECT * FROM admins WHERE username = ?',
    args: [username],
  });
  const admin = result.rows[0];

  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password.' });
  }

  req.session.adminId = admin.id;
  req.session.adminUsername = admin.username;
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Everything below requires login
router.use(requireAdmin);

// ---------- DASHBOARD ----------
router.get('/', async (req, res) => {
  const productCount = (await db.execute('SELECT COUNT(*) AS c FROM products')).rows[0].c;
  const categoryCount = (await db.execute('SELECT COUNT(*) AS c FROM categories')).rows[0].c;
  const enquiryCount = (await db.execute('SELECT COUNT(*) AS c FROM enquiries')).rows[0].c;
  const newEnquiryCount = (await db.execute("SELECT COUNT(*) AS c FROM enquiries WHERE status = 'New'")).rows[0].c;
  const recentEnquiries = (await db.execute('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 5')).rows;

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    productCount,
    categoryCount,
    enquiryCount,
    newEnquiryCount,
    recentEnquiries,
    adminUsername: req.session.adminUsername,
  });
});

// ---------- PRODUCTS ----------
router.get('/products', async (req, res) => {
  const result = await db.execute(`
    SELECT products.*, categories.name AS category_name
    FROM products LEFT JOIN categories ON products.category_id = categories.id
    ORDER BY products.created_at DESC
  `);
  res.render('admin/products', { title: 'Manage Products', products: result.rows });
});

router.get('/products/new', async (req, res) => {
  const result = await db.execute('SELECT * FROM categories ORDER BY name ASC');
  res.render('admin/product-form', { title: 'Add Product', product: null, categories: result.rows });
});

router.post('/products/new', upload.single('image_file'), async (req, res) => {
  const { name, category_id, description, specifications, availability, featured, image_url } = req.body;
  const slug = slugify(name) + '-' + Date.now().toString().slice(-5);
  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || '/assets/products/product-1.jpeg');

  await db.execute({
    sql: `INSERT INTO products (name, slug, category_id, description, specifications, image, featured, availability)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [name, slug, category_id || null, description || '', specifications || '', image, featured ? 1 : 0, availability || 'In Stock'],
  });

  res.redirect('/admin/products');
});

router.get('/products/:id/edit', async (req, res) => {
  const prodResult = await db.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [req.params.id],
  });
  const product = prodResult.rows[0];
  if (!product) return res.redirect('/admin/products');
  const catResult = await db.execute('SELECT * FROM categories ORDER BY name ASC');
  res.render('admin/product-form', { title: 'Edit Product', product, categories: catResult.rows });
});

router.post('/products/:id/edit', upload.single('image_file'), async (req, res) => {
  const { name, category_id, description, specifications, availability, featured, image_url } = req.body;
  const existingResult = await db.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [req.params.id],
  });
  const existing = existingResult.rows[0];
  if (!existing) return res.redirect('/admin/products');

  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || existing.image);

  await db.execute({
    sql: `UPDATE products SET name=?, category_id=?, description=?, specifications=?, image=?, featured=?, availability=?
          WHERE id=?`,
    args: [name, category_id || null, description || '', specifications || '', image, featured ? 1 : 0, availability || 'In Stock', req.params.id],
  });

  res.redirect('/admin/products');
});

router.post('/products/:id/delete', async (req, res) => {
  await db.execute({
    sql: 'DELETE FROM products WHERE id = ?',
    args: [req.params.id],
  });
  res.redirect('/admin/products');
});

// ---------- CATEGORIES ----------
router.get('/categories', async (req, res) => {
  const result = await db.execute(`
    SELECT categories.*, (SELECT COUNT(*) FROM products WHERE products.category_id = categories.id) AS product_count
    FROM categories ORDER BY name ASC
  `);
  res.render('admin/categories', { title: 'Manage Categories', categories: result.rows });
});

router.post('/categories/new', upload.single('image_file'), async (req, res) => {
  const { name, image_url } = req.body;
  const slug = slugify(name);
  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || '/assets/posters/poster-1.jpeg');
  try {
    await db.execute({
      sql: 'INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)',
      args: [name, slug, image],
    });
  } catch (e) { /* ignore duplicate */ }
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', async (req, res) => {
  await db.execute({
    sql: 'DELETE FROM categories WHERE id = ?',
    args: [req.params.id],
  });
  res.redirect('/admin/categories');
});

// ---------- ENQUIRIES ----------
router.get('/enquiries', async (req, res) => {
  const statusFilter = req.query.status || '';
  let sql = 'SELECT * FROM enquiries';
  const params = [];
  if (statusFilter) {
    sql += ' WHERE status = ?';
    params.push(statusFilter);
  }
  sql += ' ORDER BY created_at DESC';
  const result = await db.execute({ sql, args: params });
  res.render('admin/enquiries', { title: 'Enquiries', enquiries: result.rows, statusFilter });
});

router.get('/enquiries/:id', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM enquiries WHERE id = ?',
    args: [req.params.id],
  });
  const enquiry = result.rows[0];
  if (!enquiry) return res.redirect('/admin/enquiries');
  res.render('admin/enquiry-detail', { title: 'Enquiry Details', enquiry });
});

router.post('/enquiries/:id/status', async (req, res) => {
  const { status } = req.body;
  await db.execute({
    sql: 'UPDATE enquiries SET status = ? WHERE id = ?',
    args: [status, req.params.id],
  });
  res.redirect(`/admin/enquiries/${req.params.id}`);
});

// 🗑️ Delete Enquiry Route

router.post('/enquiries/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute({
      sql: 'DELETE FROM enquiries WHERE id = ?',
      args: [id],
    });

    res.redirect('/admin/enquiries');
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).send("Failed to delete enquiry");
  }
});

// ---------- SETTINGS ----------
router.get('/settings', async (req, res) => {
  const row = await settingsService.getRawRow();
  res.render('admin/settings', {
    title: 'Settings',
    settings: row,
    success: req.query.success === '1',
    error: null,
  });
});

router.post(
  '/settings',
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'favicon_file', maxCount: 1 },
    { name: 'hero_slide_files', maxCount: 10 },
    { name: 'owner_photo_file', maxCount: 1 },
  ]),
  async (req, res) => {
    const b = req.body;
    console.log("REQ BODY:", req.body);
    const existing = await settingsService.getRawRow();

    try {
      // ---- Validation ----
      const errors = [];
      if (!sanitizeInput(b.business_name)) errors.push('Business name is required.');
      if (b.email && !isValidEmail(b.email)) errors.push('Primary email address is invalid.');
      if (b.email_alternate && !isValidEmail(b.email_alternate)) errors.push('Alternate email address is invalid.');
      if (b.phone_primary && !isValidPhone(b.phone_primary)) errors.push('Primary mobile number is invalid.');
      if (b.phone_secondary && !isValidPhone(b.phone_secondary)) errors.push('Secondary mobile number is invalid.');
      if (b.whatsapp_number && !isValidPhone(b.whatsapp_number)) errors.push('WhatsApp number is invalid.');
      const urlFields = { facebook_url: 'Facebook URL', instagram_url: 'Instagram URL', youtube_url: 'YouTube URL', linkedin_url: 'LinkedIn URL', map_url: 'Google Maps URL', map_embed_url: 'Google Maps Embed URL' };
      Object.keys(urlFields).forEach((f) => {
        if (b[f] && !isValidUrl(b[f])) errors.push(`${urlFields[f]} must be a valid link (starting with http:// or https://).`);
      });

      if (errors.length) {
        return res.render('admin/settings', {
          title: 'Settings',
          settings: { ...existing, ...b },
          success: false,
          error: errors.join(' '),
        });
      }
       // ---------- Update Admin Username & Password ----------
if (b.admin_username || b.new_password) {

    const adminResult = await db.execute({
        sql: "SELECT * FROM admins WHERE id = ?",
        args: [req.session.adminId],
    });
    const admin = adminResult.rows[0];

    if (!admin) {
        throw new Error("Admin not found");
    }

    // Check current password
    if (!bcrypt.compareSync(b.current_password || "", admin.password_hash)) {
        return res.render("admin/settings", {
            title: "Settings",
            settings: { ...existing, ...b },
            success: false,
            error: b.current_password
              ? "Current password is incorrect."
              : "Please enter your current password in the Admin Account tab to change the username or password."
        });
    }

    // Password confirmation
    if (b.new_password !== b.confirm_password) {
        return res.render("admin/settings", {
            title: "Settings",
            settings: { ...existing, ...b },
            success: false,
            error: "New password and confirm password do not match."
        });
    }

    const username = b.admin_username || admin.username;

    const passwordHash = b.new_password
        ? bcrypt.hashSync(b.new_password, 10)
        : admin.password_hash;

    await db.execute({
        sql: `UPDATE admins SET username = ?, password_hash = ? WHERE id = ?`,
        args: [username, passwordHash, admin.id],
    });
    const updatedAdmin = (await db.execute({
        sql: "SELECT * FROM admins WHERE id=?",
        args: [req.session.adminId],
    })).rows[0];
    console.log(updatedAdmin);
    req.session.adminUsername = username;
}
      // ---- Business hours ----
      const hours = {};
      DAY_ORDER.forEach((day) => {
        hours[day] = {
          open: sanitizeInput(b[`hours_${day}_open`]),
          close: sanitizeInput(b[`hours_${day}_close`]),
          closed: b[`hours_${day}_closed`] === 'on',
        };
      });

      // ---- Images (keep existing image if a new one wasn't uploaded / URL not given) ----
      const logoFile = req.files && req.files.logo_file && req.files.logo_file[0];
      const faviconFile = req.files && req.files.favicon_file && req.files.favicon_file[0];
      const logo = logoFile ? `/uploads/${logoFile.filename}` : (sanitizeInput(b.logo_url) || existing.logo);
      const favicon = faviconFile ? `/uploads/${faviconFile.filename}` : (sanitizeInput(b.favicon_url) || existing.favicon);

      // ---- Homepage slideshow (keep existing slides not checked for removal, append new uploads) ----
      // Existing slides are posted back as parallel arrays (one entry per slide,
      // in the order they were rendered) so we can save any edited title/subtitle
      // text alongside each image.
      const existingImages = [].concat(b.hero_slide_image || []).filter(Boolean);
      const existingTitles = [].concat(b.hero_slide_title || []);
      const existingSubtitles = [].concat(b.hero_slide_subtitle || []);
      const removeSlides = [].concat(b.remove_hero_slide || []);
      const existingSlides = existingImages
        .map((image, i) => ({
          image,
          title: sanitizeInput(existingTitles[i] || ''),
          subtitle: sanitizeInput(existingSubtitles[i] || ''),
        }))
        .filter((slide) => !removeSlides.includes(slide.image));
      const newSlideFiles = (req.files && req.files.hero_slide_files) || [];
      const heroSlides = existingSlides.concat(
        newSlideFiles.map((f) => ({ image: `/uploads/${f.filename}`, title: '', subtitle: '' }))
      );

      // ---- Owner photo (keep existing if no new file uploaded) ----
      const ownerPhotoFile = req.files && req.files.owner_photo_file && req.files.owner_photo_file[0];
      const ownerPhoto = ownerPhotoFile ? `/uploads/${ownerPhotoFile.filename}` : (existing.owner_photo || '');
     
      await settingsService.updateSettings({
        
        business_name: sanitizeInput(b.business_name),
        short_name: sanitizeInput(b.short_name),
        tagline: sanitizeInput(b.tagline),
        description: sanitizeInput(b.description),
        logo,
        favicon,

        phone_primary: sanitizeInput(b.phone_primary),
        phone_secondary: sanitizeInput(b.phone_secondary),
        whatsapp_number: sanitizeInput(b.whatsapp_number).replace(/[^\d]/g, ''),
        whatsapp_message: sanitizeInput(b.whatsapp_message),
        email: sanitizeInput(b.email),
        email_alternate: sanitizeInput(b.email_alternate),

        address: sanitizeInput(b.address),
        area: sanitizeInput(b.area),
        city: sanitizeInput(b.city),
        state: sanitizeInput(b.state),
        pincode: sanitizeInput(b.pincode),
        country: sanitizeInput(b.country),

        business_hours: JSON.stringify(hours),

        facebook_url: sanitizeInput(b.facebook_url),
        instagram_url: sanitizeInput(b.instagram_url),
        youtube_url: sanitizeInput(b.youtube_url),
        linkedin_url: sanitizeInput(b.linkedin_url),

        map_url: sanitizeInput(b.map_url),
        map_embed_url: sanitizeInput(b.map_embed_url),

        website_title: sanitizeInput(b.website_title),
        meta_description: sanitizeInput(b.meta_description),
        footer_copyright: sanitizeInput(b.footer_copyright),

        hero_slides: JSON.stringify(heroSlides),
        owner_photo: ownerPhoto,
        owner_intro: sanitizeInput(b.owner_intro),
      });

      res.redirect('/admin/settings?success=1');
    } catch (err) {
      console.error('Failed to save settings:', err);
      res.render('admin/settings', {
        title: 'Settings',
        settings: { ...existing, ...b },
        success: false,
        error: 'Something went wrong while saving settings. Please try again.',
      });
    }
  }
);

module.exports = router;
