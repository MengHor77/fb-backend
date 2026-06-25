const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'postgres',
    user: 'postgres',
    password: '123'
});

async function createDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Check if database exists
        const result = await client.query(
            "SELECT datname FROM pg_database WHERE datname = 'fb_automation'"
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Database "fb_automation" already exists');
        } else {
            console.log('📝 Creating database "fb_automation"...');
            await client.query('CREATE DATABASE fb_automation');
            console.log('✅ Database "fb_automation" created!');
        }
        
        await client.end();
        console.log('\n🎉 Ready to run your app!');
        console.log('Run: npm run dev');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

createDatabase();