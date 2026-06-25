require('dotenv').config();

module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Database Configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5433,
    DB_NAME: process.env.DB_NAME || 'fb_automation',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || '123',
    
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || '99fed8ecac297eaf69aab353285671e46c10072b4b16bc8b7ae3715a07fac07b764d8179d6105d5d93ddc43d4f6984338d004817d99f85fcea2446f97283c37c',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    
    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    
    // Automation Configuration
    AUTOMATION: {
        headless: process.env.HEADLESS !== 'false',
        defaultDelay: parseInt(process.env.DEFAULT_DELAY) || 10000,
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        timeout: parseInt(process.env.TIMEOUT) || 30000
    }
};