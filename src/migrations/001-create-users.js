const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('users', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            first_name: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            last_name: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            facebook_profile: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            automation_status: {
                type: DataTypes.JSONB,
                defaultValue: {
                    isRunning: false,
                    status: 'idle',
                    progress: 0,
                    totalProfiles: 0,
                    generatedProfiles: 0,
                    failedProfiles: 0,
                    logs: []
                }
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
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true
            },
            last_login: {
                type: DataTypes.DATE,
                allowNull: true
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create indexes
        await queryInterface.addIndex('users', ['email']);
        await queryInterface.addIndex('users', ['is_active']);
        await queryInterface.addIndex('users', ['is_deleted']);
        await queryInterface.addIndex('users', ['role']);
        await queryInterface.addIndex('users', ['created_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('users');
    }
};