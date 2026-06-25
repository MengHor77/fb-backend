const { Client } = require('pg');

console.log('🔍 Testing PostgreSQL connections...');
console.log('=====================================');

// Try different ports
const ports = [5432, 5433, 5434, 5435];
const passwords = ['postgres', '123', 'admin', ''];

async function testConnection(port, password) {
    const config = {
        host: 'localhost',
        port: port,
        database: 'postgres',
        user: 'postgres',
        password: password,
        connectionTimeoutMillis: 2000
    };
    
    const client = new Client(config);
    
    try {
        console.log(`Testing: port=${port}, password=${password || '(empty)'}`);
        await client.connect();
        console.log(`✅ SUCCESS! PostgreSQL is on port ${port} with password "${password}"`);
        
        // Check if fb_automation exists
        const result = await client.query("SELECT datname FROM pg_database WHERE datname = 'fb_automation'");
        if (result.rows.length > 0) {
            console.log(`✅ Database "fb_automation" exists`);
        } else {
            console.log(`⚠️ Database "fb_automation" does NOT exist`);
            console.log('📝 Create it in pgAdmin');
        }
        
        await client.end();
        console.log('\n📝 Update your .env file:');
        console.log(`DB_PORT=${port}`);
        console.log(`DB_PASSWORD=${password}`);
        console.log('\nThen run: npm run dev');
        return true;
    } catch (err) {
        if (err.code !== 'ECONNREFUSED') {
            console.log(`❌ Error: ${err.message}`);
        }
        return false;
    }
}

async function main() {
    for (const port of ports) {
        for (const password of passwords) {
            const success = await testConnection(port, password);
            if (success) {
                process.exit(0);
            }
        }
    }
    
    console.log('\n❌ Could not connect to PostgreSQL.');
    console.log('\n📝 Please check:');
    console.log('1. PostgreSQL is running (services.msc)');
    console.log('2. PostgreSQL port (default is 5432)');
    console.log('3. Password (default is "postgres")');
    console.log('4. Host is "localhost"');
}

main();