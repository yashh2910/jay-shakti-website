// ============================================================
// CENTRAL CONFIGURATION FILE
// Change business details, WhatsApp number and admin info here.
// Values can also be overridden using a .env file (see .env.example)
// ============================================================
require('dotenv').config();

module.exports = {
  business: {
    name: process.env.BUSINESS_NAME || 'Jay Shakti Hardware & Electronics',
    shortName: process.env.BUSINESS_SHORT_NAME || 'Jay Shakti',
    tagline: process.env.BUSINESS_TAGLINE || 'Your Trusted Partner for Hardware, Electrical & Electronic Needs',
    description: process.env.BUSINESS_DESCRIPTION ||
      'Jay Shakti Hardware & Electronics supplies a wide range of hardware items, electrical goods, electronic components, tools, wires, cables, switches and lighting solutions for homes, offices and industries.',
    address: process.env.BUSINESS_ADDRESS || 'Shop No. __, Main Market Road, Your City, Gujarat, India - 000000',
    phone: process.env.BUSINESS_PHONE || '+91 90000 00000',
    whatsapp: process.env.WHATSAPP_NUMBER || '919000000000', // digits only, country code first, no + or spaces
    email: process.env.BUSINESS_EMAIL || 'info@jayshakti.example.com',
    hours: process.env.BUSINESS_HOURS || 'Mon - Sat: 9:30 AM - 8:30 PM  |  Sunday: 10:00 AM - 2:00 PM',
    mapEmbedUrl: process.env.MAP_EMBED_URL || '', // paste a Google Maps embed URL here
    socials: {
      facebook: process.env.SOCIAL_FACEBOOK || '',
      instagram: process.env.SOCIAL_INSTAGRAM || '',
    },
  },

  // Brand theme: Royal Blue + Platinum Silver corporate palette.
  // Change these to instantly re-theme the entire website.
  theme: {
    primary: process.env.THEME_PRIMARY || '#0F4C81',        // royal blue
    primaryDark: process.env.THEME_PRIMARY_DARK || '#0A3557', // deep navy (hero/footer/overlays)
    secondary: process.env.THEME_SECONDARY || '#1E88E5',    // modern blue (gradients/highlights)
    accent: process.env.THEME_ACCENT || '#A9B7C6',          // platinum silver
    accentDark: process.env.THEME_ACCENT_DARK || '#5C6B7D', // gunmetal
    dark: '#1E293B',   // dark slate — heading/body text + dark section backgrounds
    light: '#F8FAFC',  // light background
  },

  session: {
    secret: process.env.SESSION_SECRET || 'jay-shakti-change-this-secret-in-production',
  },

  admin: {
    defaultUsername: process.env.ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_PASSWORD || 'JayShakti@123', // change after first login
  },
};
