const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// User Validator class embedded in the same file
class UserValidator {
    static validateEmail(email) {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        return password && password.length >= 6;
    }

    static validateName(name) {
        return name && name.length >= 2 && name.length <= 50;
    }

    static async isEmailUnique(email, excludeUserId = null) {
        const query = { 
            email: email.toLowerCase() 
        };
        if (excludeUserId) {
            query.id = { [Op.ne]: excludeUserId };
        }
        const existingUser = await User.findOne({ where: query });
        return !existingUser;
    }

    static sanitizeUserData(data) {
        const sanitized = { ...data };
        
        // Remove sensitive fields
        delete sanitized.password;
        delete sanitized.isDeleted;
        delete sanitized.deletedAt;
        
        return sanitized;
    }

    static validateFacebookProfile(profile) {
        const errors = [];
        
        if (!profile) return { isValid: true, errors: [] };
        
        if (profile.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(profile.gender)) {
            errors.push('Invalid gender value');
        }
        
        if (profile.work && !Array.isArray(profile.work)) {
            errors.push('Work must be an array');
        }
        
        if (profile.education && !Array.isArray(profile.education)) {
            errors.push('Education must be an array');
        }
        
        if (profile.interests && !Array.isArray(profile.interests)) {
            errors.push('Interests must be an array');
        }
        
        return { isValid: errors.length === 0, errors };
    }

    static validateAutomationSettings(settings) {
        const errors = [];
        
        if (!settings) return { isValid: true, errors: [] };
        
        if (settings.generationInterval && !['daily', 'weekly', 'monthly', 'manual'].includes(settings.generationInterval)) {
            errors.push('Invalid generation interval');
        }
        
        if (settings.maxProfilesPerDay && (settings.maxProfilesPerDay < 1 || settings.maxProfilesPerDay > 100)) {
            errors.push('Max profiles per day must be between 1 and 100');
        }
        
        return { isValid: errors.length === 0, errors };
    }
}

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'First name is required' },
            len: { args: [2, 50], msg: 'First name must be at least 2 characters' }
        },
        field: 'first_name'
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Last name is required' },
            len: { args: [2, 50], msg: 'Last name must be at least 2 characters' }
        },
        field: 'last_name'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            msg: 'Email already exists'
        },
        validate: {
            isEmail: { msg: 'Please provide a valid email address' },
            notEmpty: { msg: 'Email is required' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: { args: [6, 255], msg: 'Password must be at least 6 characters' },
            notEmpty: { msg: 'Password is required' }
        }
    },
    facebookProfile: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'facebook_profile'
    },
    automationStatus: {
        type: DataTypes.JSONB,
        defaultValue: {
            isRunning: false,
            lastRun: null,
            nextRun: null,
            status: 'idle',
            progress: 0,
            totalProfiles: 0,
            generatedProfiles: 0,
            failedProfiles: 0,
            logs: []
        },
        field: 'automation_status'
    },
    settings: {
        type: DataTypes.JSONB,
        defaultValue: {
            autoGenerate: false,
            generationInterval: 'manual',
            maxProfilesPerDay: 10,
            notifications: {
                email: true,
                push: true
            }
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'super-admin'),
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted'
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
            
            // Validate facebook profile
            if (user.facebookProfile) {
                const validation = UserValidator.validateFacebookProfile(user.facebookProfile);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }
            
            // Validate settings
            if (user.settings) {
                const validation = UserValidator.validateAutomationSettings(user.settings);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
            
            // Validate facebook profile
            if (user.changed('facebookProfile') && user.facebookProfile) {
                const validation = UserValidator.validateFacebookProfile(user.facebookProfile);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }
            
            // Validate settings
            if (user.changed('settings') && user.settings) {
                const validation = UserValidator.validateAutomationSettings(user.settings);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }
        }
    }
});

// Virtual fields (getters)
User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

User.prototype.getProfileCompletion = function() {
    if (!this.facebookProfile) return 0;
    
    const fields = [
        this.facebookProfile.name,
        this.facebookProfile.email,
        this.facebookProfile.birthday,
        this.facebookProfile.gender,
        this.facebookProfile.profilePicture,
        this.facebookProfile.bio,
        this.facebookProfile.location
    ];
    
    const filled = fields.filter(field => field !== undefined && field !== null && field !== '');
    return Math.round((filled.length / fields.length) * 100);
};

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

User.prototype.addAutomationLog = async function(message, type = 'info') {
    const logs = this.automationStatus.logs || [];
    logs.push({
        message,
        type,
        timestamp: new Date()
    });
    
    // Keep only last 100 logs
    if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
    }
    
    this.automationStatus.logs = logs;
    await this.save();
    return this;
};

User.prototype.updateProgress = async function(progress) {
    this.automationStatus.progress = Math.min(100, Math.max(0, progress));
    await this.save();
    return this;
};

User.prototype.incrementGeneratedProfiles = async function(count = 1) {
    this.automationStatus.generatedProfiles += count;
    await this.save();
    return this;
};

User.prototype.incrementFailedProfiles = async function(count = 1) {
    this.automationStatus.failedProfiles += count;
    await this.save();
    return this;
};

User.prototype.startAutomation = async function(totalProfiles = 0) {
    this.automationStatus.isRunning = true;
    this.automationStatus.status = 'running';
    this.automationStatus.lastRun = new Date();
    this.automationStatus.totalProfiles = totalProfiles;
    this.automationStatus.generatedProfiles = 0;
    this.automationStatus.failedProfiles = 0;
    this.automationStatus.progress = 0;
    await this.save();
    return this;
};

User.prototype.stopAutomation = async function(status = 'completed') {
    this.automationStatus.isRunning = false;
    this.automationStatus.status = status;
    this.automationStatus.progress = 100;
    await this.save();
    return this;
};

User.prototype.pauseAutomation = async function() {
    if (this.automationStatus.isRunning) {
        this.automationStatus.isRunning = false;
        this.automationStatus.status = 'paused';
        await this.save();
    }
    return this;
};

User.prototype.resumeAutomation = async function() {
    if (this.automationStatus.status === 'paused') {
        this.automationStatus.isRunning = true;
        this.automationStatus.status = 'running';
        await this.save();
    }
    return this;
};

User.prototype.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.isActive = false;
    await this.save();
    return this;
};

User.prototype.restore = async function() {
    this.isDeleted = false;
    this.deletedAt = null;
    this.isActive = true;
    await this.save();
    return this;
};

// Static methods
User.findActiveUsers = function() {
    return this.findAll({
        where: {
            isActive: true,
            isDeleted: false
        }
    });
};

User.getAutomationStats = async function() {
    const [results] = await sequelize.query(`
        SELECT 
            automation_status->>'status' as status,
            COUNT(*) as count,
            SUM((automation_status->>'totalProfiles')::int) as total_profiles,
            SUM((automation_status->>'generatedProfiles')::int) as generated_profiles,
            SUM((automation_status->>'failedProfiles')::int) as failed_profiles
        FROM users
        WHERE is_deleted = false
        GROUP BY automation_status->>'status'
    `);
    return results;
};

User.findByAutomationStatus = function(status) {
    return this.findAll({
        where: {
            isDeleted: false,
            isActive: true
        },
        // PostgreSQL JSON query
        where: sequelize.literal(`automation_status->>'status' = '${status}'`)
    });
};

User.getPaginatedUsers = async function(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    const where = { isDeleted: false, ...filters };
    
    const { count, rows } = await this.findAndCountAll({
        where,
        offset,
        limit,
        order: [['created_at', 'DESC']]
    });
    
    return {
        users: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
    };
};

// Override toJSON to remove sensitive data
User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

// Export both the model and the validator
module.exports = {
    User,
    UserValidator
};