const mongoose = require('mongoose');
const config = require('../../config');
const { logInfo, logError } = require('../logger');

class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(config.MONGODB_URI, options);
      
      logInfo('Database', `MongoDB connected: ${this.connection.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logError('Database', err);
      });

      mongoose.connection.on('disconnected', () => {
        logInfo('Database', 'MongoDB disconnected');
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      logError('Database', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      logInfo('Database', 'MongoDB connection closed');
    } catch (error) {
      logError('Database', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Clear all collections (for testing)
   */
  async clearDatabase() {
    if (config.NODE_ENV !== 'test') {
      throw new Error('clearDatabase can only be used in test environment');
    }

    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

module.exports = new Database();
