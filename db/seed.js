// Run with: npm run seed
// Populates starter categories and products using the images copied from
// the uploaded ZIP into public/assets/products. Edit or remove any of this
// freely from the Admin Panel once the site is running.

const db = require('./database');

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const categories = [
  { name: 'Hardware Items', image: '/assets/posters/poster-1.jpeg' },
  { name: 'Electrical Items', image: '/assets/posters/poster-2.jpeg' },
  { name: 'Electronic Components', image: '/assets/posters/poster-3.jpeg' },
  { name: 'Switches & Sockets', image: '/assets/posters/poster-4.jpeg' },
  { name: 'Wires & Cables', image: '/assets/posters/poster-5.jpeg' },
  { name: 'Tools', image: '/assets/posters/poster-6.jpeg' },
  { name: 'LED & Lighting', image: '/assets/posters/poster-7.jpeg' },
  { name: 'Other Products', image: '/assets/posters/poster-8.jpeg' },
];

const insertCategory = db.prepare(
  'INSERT OR IGNORE INTO categories (name, slug, image) VALUES (?, ?, ?)'
);
const getCategoryId = db.prepare('SELECT id FROM categories WHERE slug = ?');

const catIds = {};
for (const c of categories) {
  const slug = slugify(c.name);
  insertCategory.run(c.name, slug, c.image);
  catIds[c.name] = getCategoryId.get(slug).id;
}

const sampleProducts = [
  {
    name: 'Premium Copper Wire (90m Coil)',
    category: 'Wires & Cables',
    description: 'High-conductivity copper wiring suitable for home and commercial electrical wiring. Durable insulation for long service life.',
    specifications: 'Core: Copper | Insulation: PVC | Length: 90 meters | Rated Voltage: 1100V',
    image: '/assets/products/product-1.jpeg',
    featured: 1,
  },
  {
    name: 'Modular Switch & Socket Combo',
    category: 'Switches & Sockets',
    description: 'Elegant modular switches and sockets with fire-retardant polycarbonate body. Ideal for modern homes and offices.',
    specifications: 'Rating: 6A/16A | Body: Polycarbonate | Finish: Matte White',
    image: '/assets/products/product-2.jpeg',
    featured: 1,
  },
  {
    name: 'LED Bulb - 9 Watt (Pack of 4)',
    category: 'LED & Lighting',
    description: 'Energy-efficient LED bulbs offering bright, flicker-free illumination with a long lifespan.',
    specifications: 'Wattage: 9W | Base: B22 | Lumens: 900lm | Life: 25,000 hrs',
    image: '/assets/products/product-3.jpeg',
    featured: 1,
  },
  {
    name: 'Heavy Duty Tool Kit',
    category: 'Tools',
    description: 'Multi-purpose hand tool kit for home and professional use, including screwdrivers, pliers, wrenches and more.',
    specifications: 'Pieces: 45 | Case: Impact-resistant | Material: Chrome Vanadium Steel',
    image: '/assets/posters/poster-9.jpeg',
    featured: 0,
  },
  {
    name: 'MCB Distribution Box',
    category: 'Electrical Items',
    description: 'Compact and safe distribution box for circuit protection in homes and small commercial spaces.',
    specifications: 'Ways: 8 | Material: Fire-retardant ABS | IP Rating: IP43',
    image: '/assets/banners/banner-2.jpeg',
    featured: 0,
  },
  {
    name: 'Assorted Electronic Components Pack',
    category: 'Electronic Components',
    description: 'A handy assortment of resistors, capacitors, diodes and connectors for repair and DIY electronics work.',
    specifications: 'Includes: Resistors, Capacitors, Diodes, Connectors',
    image: '/assets/products/product-1.jpeg',
    featured: 0,
  },
  {
    name: 'Stainless Steel Door Hinges (Pack of 6)',
    category: 'Hardware Items',
    description: 'Rust-resistant stainless steel hinges built for daily heavy use on doors and cabinets.',
    specifications: 'Material: Stainless Steel | Size: 4 inch | Pack: 6 pcs',
    image: '/assets/posters/poster-4.jpeg',
    featured: 0,
  },
  {
    name: 'PVC Pipe Fittings Set',
    category: 'Other Products',
    description: 'Reliable PVC fittings for plumbing and electrical conduit applications.',
    specifications: 'Material: PVC | Sizes: Mixed | Use: Plumbing / Conduit',
    image: '/assets/posters/poster-6.jpeg',
    featured: 0,
  },
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (name, slug, category_id, description, specifications, image, featured, availability)
  VALUES (@name, @slug, @category_id, @description, @specifications, @image, @featured, @availability)
`);

for (const p of sampleProducts) {
  insertProduct.run({
    name: p.name,
    slug: slugify(p.name),
    category_id: catIds[p.category] || null,
    description: p.description,
    specifications: p.specifications,
    image: p.image,
    featured: p.featured,
    availability: 'In Stock',
  });
}

console.log('Seed complete: categories and sample products added.');
console.log('Log in to /admin to edit, replace or add your real products and images.');
