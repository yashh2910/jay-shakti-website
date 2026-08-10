const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const config = require('../config');

// Use Turso cloud when URL is provided, otherwise fall back to a local
// SQLite file so development works without an internet connection.
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:db/jayshakti.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialise the database: create tables, run migrations, seed defaults.
// Must be called (and awaited) once at server startup before any requests.
async function initDb() {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        category_id INTEGER,
        description TEXT,
        specifications TEXT,
        image TEXT,
        featured INTEGER DEFAULT 0,
        availability TEXT DEFAULT 'In Stock',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )`,

      `CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT,
        product_id INTEGER,
        product_name TEXT,
        quantity TEXT,
        message TEXT,
        status TEXT DEFAULT 'New',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )`,

      `CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        business_name TEXT,
        short_name TEXT,
        tagline TEXT,
        description TEXT,
        logo TEXT,
        favicon TEXT,
        phone_primary TEXT,
        phone_secondary TEXT,
        whatsapp_number TEXT,
        whatsapp_message TEXT,
        email TEXT,
        email_alternate TEXT,
        address TEXT,
        area TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        country TEXT,
        business_hours TEXT,
        facebook_url TEXT,
        instagram_url TEXT,
        youtube_url TEXT,
        linkedin_url TEXT,
        map_url TEXT,
        map_embed_url TEXT,
        website_title TEXT,
        meta_description TEXT,
        footer_copyright TEXT,
        hero_slides TEXT,
        owner_photo TEXT,
        owner_intro TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
    ],
    'write'
  );

  // Migration: add new columns to an EXISTING settings table/database
  // (CREATE TABLE IF NOT EXISTS above only applies to brand-new DBs, so
  // databases created before this update need these columns added on).
  const migrations = {
    hero_slides: 'ALTER TABLE settings ADD COLUMN hero_slides TEXT',
    owner_photo: 'ALTER TABLE settings ADD COLUMN owner_photo TEXT',
    owner_intro: 'ALTER TABLE settings ADD COLUMN owner_intro TEXT',
  };
  for (const [, sql] of Object.entries(migrations)) {
    try {
      await db.execute(sql);
    } catch (e) {
      // Column already exists — ignore
    }
  }

  // Seed default admin if none exists
  const adminResult = await db.execute('SELECT COUNT(*) as c FROM admins');
  if (adminResult.rows[0].c === 0) {
    const hash = bcrypt.hashSync(config.admin.defaultPassword, 10);
    await db.execute({
      sql: 'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      args: [config.admin.defaultUsername, hash],
    });
    console.log(`Default admin created -> username: ${config.admin.defaultUsername}`);
  }

  // Seed default settings row (single global row, id = 1) if none exists yet.
  const settingsResult = await db.execute('SELECT COUNT(*) as c FROM settings');
  if (settingsResult.rows[0].c === 0) {
    const b = config.business;
    const defaultHours = JSON.stringify({
      monday: { open: '09:30', close: '20:30', closed: false },
      tuesday: { open: '09:30', close: '20:30', closed: false },
      wednesday: { open: '09:30', close: '20:30', closed: false },
      thursday: { open: '09:30', close: '20:30', closed: false },
      friday: { open: '09:30', close: '20:30', closed: false },
      saturday: { open: '09:30', close: '20:30', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: false },
    });

    await db.execute({
      sql: `INSERT INTO settings (
        id, business_name, short_name, tagline, description, logo, favicon,
        phone_primary, phone_secondary, whatsapp_number, whatsapp_message, email, email_alternate,
        address, area, city, state, pincode, country, business_hours,
        facebook_url, instagram_url, youtube_url, linkedin_url,
        map_url, map_embed_url, website_title, meta_description, footer_copyright
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )`,
      args: [
        b.name, b.shortName, b.tagline, b.description, '/assets/logo/logo.jpeg', '/assets/logo/logo.jpeg',
        b.phone, '', b.whatsapp, '', b.email, '',
        b.address, '', '', '', '', 'India', defaultHours,
        b.socials.facebook || '', b.socials.instagram || '', '', '',
        '', b.mapEmbedUrl || '', b.name, b.description, '',
      ],
    });
    console.log('Default business settings created in database (editable from Admin → Settings).');
  }
}

module.exports = db;
module.exports.initDb = initDb;
