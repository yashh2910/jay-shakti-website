function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Builds a wa.me link with a pre-filled enquiry message.
// opts.businessName    -> used in the greeting line
// opts.defaultMessage  -> admin-configured default message (Settings -> WhatsApp), used when no
//                         product/quantity/custom message context is available
function buildWhatsAppLink(whatsappNumber, opts = {}) {
    const {
        customerName,
        productName,
        quantity,
        message,
        defaultMessage
    } = opts;

    const lines = [];

    // Admin-configured default message
    if (defaultMessage && defaultMessage.trim()) {
        lines.push(defaultMessage.trim());
    }

    // Product information
    if (productName) {
        lines.push(`I am interested in: ${productName}`);
    }

    if (quantity) {
        lines.push(`Quantity: ${quantity}`);
    }

    // Customer information
    if (customerName) {
        lines.push(`My name: ${customerName}`);
    }

    if (message) {
        lines.push(`Message: ${message}`);
    }

    // Fallback message if Admin message is empty
    if (lines.length === 0) {
        lines.push('I would like to enquire about your products.');
    }

    const text = encodeURIComponent(lines.join('\n'));

    return `https://wa.me/${whatsappNumber}?text=${text}`;
}
// ---------------- Business hours formatting ----------------
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABEL = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

function to12Hour(t) {
  if (!t) return '';
  const parts = String(t).split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return '';
  const period = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// Groups consecutive days that share the same open/close/closed state into a
// readable string, e.g. "Mon - Sat: 9:30 AM - 8:30 PM  |  Sun: 10:00 AM - 2:00 PM"
function formatBusinessHours(hours) {
  if (!hours || typeof hours !== 'object') return '';
  const groups = [];
  let current = null;

  DAY_ORDER.forEach((day) => {
    const d = hours[day] || {};
    const key = d.closed ? 'closed' : `${d.open || ''}-${d.close || ''}`;
    if (current && current.key === key) {
      current.days.push(day);
    } else {
      current = { key, days: [day] };
      groups.push(current);
    }
  });

  return groups
    .map((g) => {
      const label =
        g.days.length > 1 ? `${DAY_LABEL[g.days[0]]} - ${DAY_LABEL[g.days[g.days.length - 1]]}` : DAY_LABEL[g.days[0]];
      const d = hours[g.days[0]] || {};
      const timeStr = d.closed ? 'Closed' : `${to12Hour(d.open)} - ${to12Hour(d.close)}`;
      return `${label}: ${timeStr}`;
    })
    .join('  |  ');
}

// ---------------- Validation & sanitization ----------------
function isValidEmail(email) {
  if (!email) return true; // optional fields are allowed to be empty
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidPhone(phone) {
  if (!phone) return true;
  const cleaned = String(phone).trim();
  return /^[0-9+\-\s()]{7,20}$/.test(cleaned);
}

function isValidUrl(url) {
  if (!url) return true;
  try {
    const u = new URL(String(url).trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Trims input and strips any <script> blocks as defense-in-depth.
// HTML-escaping for display is handled by EJS's `<%= %>` output tags,
// so we deliberately do not escape entities here (that would double-escape).
function sanitizeInput(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();
}

module.exports = {
  slugify,
  buildWhatsAppLink,
  formatBusinessHours,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  sanitizeInput,
  DAY_ORDER,
  DAY_LABEL,
};
