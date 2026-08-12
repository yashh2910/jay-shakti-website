const express = require('express');
const router = express.Router();
const db = require('../db/database');
const config = require('../config');
const settingsService = require('../services/settingsService');
const { buildWhatsAppLink } = require('../utils/helpers');

// Make business settings (from DB) + whatsapp helper available to every view rendered by this router.
// Settings are read fresh from the in-memory cache on every request, so any change saved in
// Admin -> Settings is reflected immediately across the whole public website.
router.use(async (req, res, next) => {
  try {
    res.locals.business = settingsService.getSettings();
    res.locals.theme = config.theme;
    res.locals.buildWhatsAppLink = buildWhatsAppLink;
    res.locals.currentPath = req.path;
    
    const catResult = await db.execute('SELECT * FROM categories ORDER BY name ASC');
    res.locals.globalCategories = catResult.rows;
    
    next();
  } catch (err) {
    next(err);
  }
});

// ---------- HOME ----------
router.get('/', async (req, res) => {
  const settings = res.locals.business;
  const featuredResult = await db.execute(
    'SELECT * FROM products WHERE featured = 1 ORDER BY created_at DESC LIMIT 8'
  );
  const catResult = await db.execute('SELECT * FROM categories ORDER BY name ASC');

  res.render('home', {
    title: `${settings.name} | ${settings.tagline}`,
    metaDescription: settings.metaDescription,
    featuredProducts: featuredResult.rows,
    categories: catResult.rows,
  });
});

// ---------- PRODUCTS (catalogue with filter + search) ----------
router.get('/products', async (req, res) => {
  const settings = res.locals.business;
  const { category, q } = req.query;
  const catResult = await db.execute('SELECT * FROM categories ORDER BY name ASC');

  let sql = `
    SELECT products.*, categories.name AS category_name, categories.slug AS category_slug
    FROM products LEFT JOIN categories ON products.category_id = categories.id
    WHERE 1 = 1
  `;
  const params = [];

  if (category) {
    sql += ' AND categories.slug = ?';
    params.push(category);
  }
  if (q) {
    sql += ' AND (products.name LIKE ? OR products.description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY products.created_at DESC';

  const prodResult = await db.execute({ sql, args: params });

  res.render('products', {
    title: `Products | ${settings.name}`,
    metaDescription: `Browse our full catalogue of hardware, electrical and electronic products at ${settings.name}.`,
    products: prodResult.rows,
    categories: catResult.rows,
    activeCategory: category || '',
    searchTerm: q || '',
  });
});

// ---------- PRODUCT DETAIL ----------
router.get('/products/:slug', async (req, res) => {
  const settings = res.locals.business;
  const result = await db.execute({
    sql: `SELECT products.*, categories.name AS category_name, categories.slug AS category_slug
          FROM products LEFT JOIN categories ON products.category_id = categories.id
          WHERE products.slug = ?`,
    args: [req.params.slug],
  });
  const product = result.rows[0];

  if (!product) {
    return res.status(404).render('404', { title: 'Product Not Found' });
  }

  const relatedResult = await db.execute({
    sql: `SELECT * FROM products
          WHERE category_id = ? AND id != ?
          ORDER BY RANDOM() LIMIT 4`,
    args: [product.category_id, product.id],
  });

  res.render('product-detail', {
    title: `${product.name} | ${settings.name}`,
    metaDescription: (product.description || '').slice(0, 155),
    product,
    relatedProducts: relatedResult.rows,
  });
});

// ---------- ABOUT ----------
router.get('/about', (req, res) => {
  const settings = res.locals.business;
  res.render('about', {
    title: `About Us | ${settings.name}`,
    metaDescription: `Learn more about ${settings.name} - our products, values and commitment to customers.`,
  });
});

// ---------- CONTACT ----------
router.get('/contact', (req, res) => {
  const settings = res.locals.business;
  res.render('contact', {
    title: `Contact Us | ${settings.name}`,
    metaDescription: `Get in touch with ${settings.name}. Visit our store, call us or send an enquiry online.`,
    submitted: req.query.submitted === '1',
  });
});

// ---------- ENQUIRY SUBMISSION (used by contact form + product enquiry form) ----------
router.post('/enquiry', async (req, res) => {
  const { customer_name, mobile, email, product_id, product_name, quantity, message, redirect_to } = req.body;

  if (!customer_name || !mobile) {
    return res.status(400).send('Name and mobile number are required.');
  }

  await db.execute({
    sql: `INSERT INTO enquiries (customer_name, mobile, email, product_id, product_name, quantity, message)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      customer_name,
      mobile,
      email || null,
      product_id || null,
      product_name || null,
      quantity || null,
      message || null,
    ],
  });

  const backTo = redirect_to || '/contact';
  const separator = backTo.includes('?') ? '&' : '?';
  res.redirect(`${backTo}${separator}submitted=1`);
});

module.exports = router;
