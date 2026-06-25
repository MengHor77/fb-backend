const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const sequelize = require('./config/database');
const { User, UserValidator } = require('./models/userModel');
const { createProfile, createMultipleProfiles, getSavedProfiles, verifyAccount } = require('./services/facebookBot');

const app = express();

// Middleware
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Database connection
async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connected successfully');
        
        // Sync models (create tables if they don't exist)
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
}

// Test route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'FB Automation API is running with PostgreSQL',
        version: '1.0.0',
        environment: config.NODE_ENV,
        endpoints: {
            createProfile: 'POST /api/create-profile',
            createMultiple: 'POST /api/create-multiple',
            getProfiles: 'GET /api/profiles',
            verifyAccount: 'POST /api/verify-account',
            getUsers: 'GET /api/users',
            getUser: 'GET /api/users/:id'
        }
    });
});

// Create single profile endpoint
app.post('/api/create-profile', async (req, res) => {
    const { firstName, lastName, email, headless = true } = req.body;
    
    if (!firstName || !lastName) {
        return res.status(400).json({
            success: false,
            error: 'First name and last name are required'
        });
    }

    try {
        console.log(`📝 Creating profile for: ${firstName} ${lastName}`);
        
        // Check if email already exists
        if (email) {
            const isUnique = await UserValidator.isEmailUnique(email);
            if (!isUnique) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already exists'
                });
            }
        }
        
        // Create user in database first
        const user = await User.create({
            firstName,
            lastName,
            email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            password: 'temporary_password_123' // Will be updated after FB creation
        });

        // Run Facebook bot
        const result = await createProfile(firstName, lastName, { 
            headless: config.AUTOMATION.headless 
        });
        
        if (result.success) {
            // Update user with Facebook profile data
            await user.update({
                facebookProfile: result.data
            });
            
            // Add automation log
            await user.addAutomationLog('Profile created successfully', 'success');
        }
        
        res.json({
            success: true,
            message: 'Profile created successfully',
            user: user.toJSON(),
            facebookResult: result
        });
    } catch (error) {
        console.error('❌ Error creating profile:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create multiple profiles endpoint
app.post('/api/create-multiple', async (req, res) => {
    const { profiles, options = {} } = req.body;
    
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Please provide an array of profiles'
        });
    }

    try {
        console.log(`🚀 Starting bulk creation for ${profiles.length} profiles`);
        
        // Create users in database first
        const createdUsers = [];
        for (const profile of profiles) {
            const user = await User.create({
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email || `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}@example.com`,
                password: 'temporary_password_123'
            });
            createdUsers.push(user);
        }
        
        // Run Facebook bot for each profile
        const results = await createMultipleProfiles(profiles, { 
            headless: config.AUTOMATION.headless,
            delay: options.delay || config.AUTOMATION.defaultDelay,
            ...options
        });
        
        // Update users with Facebook data
        for (let i = 0; i < results.length; i++) {
            if (results[i].success && createdUsers[i]) {
                await createdUsers[i].update({
                    facebookProfile: results[i].data
                });
                await createdUsers[i].addAutomationLog('Profile created successfully', 'success');
            }
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        res.json({
            success: true,
            summary: {
                total: results.length,
                successful,
                failed
            },
            users: createdUsers.map(u => u.toJSON()),
            results
        });
    } catch (error) {
        console.error('❌ Error creating multiple profiles:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await User.getPaginatedUsers(parseInt(page), parseInt(limit));
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('❌ Error getting users:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get single user
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('❌ Error getting user:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get saved profiles endpoint
app.get('/api/profiles', (req, res) => {
    try {
        const profiles = getSavedProfiles();
        res.json({
            success: true,
            count: profiles.length,
            data: profiles
        });
    } catch (error) {
        console.error('❌ Error getting profiles:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Verify account endpoint
app.post('/api/verify-account', async (req, res) => {
    const { email, password, headless = true } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required'
        });
    }

    try {
        console.log(`🔍 Verifying account: ${email}`);
        const result = await verifyAccount(email, password, { 
            headless: config.AUTOMATION.headless 
        });
        res.json(result);
    } catch (error) {
        console.error('❌ Error verifying account:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        database: sequelize ? 'Connected' : 'Not connected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
async function startServer() {
    await connectDB();
    
    app.listen(config.PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${config.PORT}`);
        console.log(`📝 Environment: ${config.NODE_ENV}`);
        console.log(`🗄️  Database: ${config.DB_NAME} on ${config.DB_HOST}:${config.DB_PORT}`);
        console.log('✅ All services initialized with PostgreSQL');
    });
}

startServer();