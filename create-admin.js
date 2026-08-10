require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db/database');

async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('❌ Usage: node create-admin.js <username> <password>');
    process.exit(1);
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    
    await db.execute({
      sql: 'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      args: [username, hash],
    });
    
    console.log(`✅ Successfully created admin: ${username}`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log(`⚠️ Admin "${username}" already exists.`);
    } else {
      console.error('❌ Error creating admin:', error);
    }
  }
}

createAdmin();
