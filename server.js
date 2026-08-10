const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const config = require('./config');
const db = require('./db/database');
const settingsService = require('./services/settingsService');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
  })
);

app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Async startup: initialise database tables + seed defaults, then listen.
(async () => {
  try {
    await db.initDb();
    await settingsService.preloadCache();

    app.listen(PORT, () => {
      console.log(`\nJay Shakti Hardware & Electronics website running at http://localhost:${PORT}`);
      console.log(`Admin panel: http://localhost:${PORT}/admin/login\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
