// ============================================================
// SETTINGS SERVICE
// Central place that reads/writes business settings from the
// database and exposes a ready-to-use object for every view
// (public site + admin panel). Cached in memory and refreshed
// immediately whenever the admin saves changes, so updates are
// visible across the whole site without restarting the server.
// ============================================================
const db = require('../db/database');
const config = require('../config');
const { formatBusinessHours, DAY_ORDER } = require('../utils/helpers');

let cache = null;

function getRawRow() {
  let row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!row) {
    // Safety net: table exists but row missing (shouldn't normally happen
    // since db/database.js seeds it) — create sensible defaults on the fly.
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
    db.prepare(`
      INSERT OR IGNORE INTO settings (id, business_name, short_name, tagline, description, logo, favicon, phone_primary, whatsapp_number, email, address, business_hours, website_title, meta_description)
      VALUES (1, ?, ?, ?, ?, '/assets/logo/logo.jpeg', '/assets/logo/logo.jpeg', ?, ?, ?, ?, ?, ?, ?)
    `).run(b.name, b.shortName, b.tagline, b.description, b.phone, b.whatsapp, b.email, b.address, defaultHours, b.name, b.description);
    row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  }
  return row;
}

function parseHours(json) {
  let hours = {};
  try {
    hours = JSON.parse(json || '{}');
  } catch (e) {
    hours = {};
  }
  // Ensure every day has a shape, so templates never hit undefined.
  const safe = {};
  DAY_ORDER.forEach((day) => {
    safe[day] = hours[day] || { open: '', close: '', closed: false };
  });
  return safe;
}

function parseHeroSlides(json) {
  try {
    const arr = JSON.parse(json || '[]');
    if (!Array.isArray(arr)) return [];
    // Normalize both old format (plain image URL strings) and new format
    // ({ image, title, subtitle }) into a consistent object shape, so every
    // template can always rely on slide.image / slide.title / slide.subtitle.
    return arr
      .filter(Boolean)
      .map((slide) => {
        if (typeof slide === 'string') {
          return { image: slide, title: '', subtitle: '' };
        }
        return {
          image: slide.image || '',
          title: slide.title || '',
          subtitle: slide.subtitle || '',
        };
      })
      .filter((slide) => slide.image);
  } catch (e) {
    return [];
  }
}

// Maps the raw DB row into the flat shape used across all templates
// (keeps backwards compatibility with the previous config.business shape:
// name, shortName, tagline, description, address, phone, whatsapp, email,
// hours, mapEmbedUrl — plus the new fields added for the Settings system).
function mapRow(row) {
  const hoursRaw = parseHours(row.business_hours);
  return {
    id: row.id,
    name: row.business_name || config.business.name,
    shortName: row.short_name || row.business_name || config.business.shortName,
    tagline: row.tagline || '',
    description: row.description || '',
    logo: row.logo || '/assets/logo/logo.jpeg',
    favicon: row.favicon || row.logo || '/assets/logo/logo.jpeg',

    phone: row.phone_primary || '',
    phoneSecondary: row.phone_secondary || '',
    whatsapp: row.whatsapp_number || '',
    whatsappMessage: row.whatsapp_message || '',
    email: row.email || '',
    emailAlternate: row.email_alternate || '',

    address: row.address || '',
    area: row.area || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    country: row.country || '',

    hoursRaw,
    hours: formatBusinessHours(hoursRaw),

    socials: {
      facebook: row.facebook_url || '',
      instagram: row.instagram_url || '',
      youtube: row.youtube_url || '',
      linkedin: row.linkedin_url || '',
    },

    mapUrl: row.map_url || '',
    mapEmbedUrl: row.map_embed_url || '',

    websiteTitle: row.website_title || row.business_name || config.business.name,
    metaDescription: row.meta_description || row.description || config.business.description,
    footerCopyright: row.footer_copyright || '',

    heroSlides: parseHeroSlides(row.hero_slides),
    ownerPhoto: row.owner_photo || '',
    ownerIntro: row.owner_intro || '',

    updatedAt: row.updated_at,
  };
}

function loadFromDb() {
  cache = mapRow(getRawRow());
  return cache;
}

// Public: get the current settings (served from in-memory cache).
function getSettings() {
  if (!cache) loadFromDb();
  return cache;
}

// Public: update settings. `fields` must be an object keyed by the exact
// snake_case DB column names (already validated/sanitized by the caller).
// Refreshes the cache immediately so changes show up everywhere on the very
// next request — no server restart required.
function updateSettings(fields) {
  const columns = Object.keys(fields);
  if (columns.length === 0) return getSettings();
  const setClause = columns.map((c) => `${c} = ?`).join(', ');
  const values = columns.map((c) => fields[c]);
  db.prepare(`UPDATE settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`).run(...values);
  return loadFromDb();
}

module.exports = { getSettings, getRawRow, updateSettings };
