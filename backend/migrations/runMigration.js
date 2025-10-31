const mongoose = require('mongoose');
const path = require('path');
const AttendanceMigration = require('./001_attendance_system_migration');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Migration runner script
 * Usage: node backend/migrations/runMigration.js
 */

async function runMigration() {
    try {
        // Connect to database
        console.log('Connecting to database...');
        const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
        if (!mongoUrl) {
            throw new Error('MongoDB connection string not found in environment variables');
        }
        await mongoose.connect(mongoUrl);
        console.log('Database connected successfully');

        // Create migration instance
        const migration = new AttendanceMigration();

        // Run migration
        await migration.migrate();

        console.log('\n✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
        
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM. Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run migration
runMigration();