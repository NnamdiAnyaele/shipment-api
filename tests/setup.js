const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Increase timeout for all tests
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to in-memory database
  await mongoose.connect(mongoUri);
});

// Clear database after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect and stop after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global test helpers
global.testHelpers = {
  /**
   * Create a test user
   */
  async createUser(userData = {}) {
    const { User } = require('../models');
    const defaultUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
      ...userData,
    };
    const user = await User.create(defaultUser);
    const token = user.generateAuthToken();
    return { user, token };
  },

  /**
   * Create a test admin
   */
  async createAdmin(userData = {}) {
    return this.createUser({ ...userData, role: 'admin' });
  },

  /**
   * Create a test shipment
   */
  async createShipment(shipmentData = {}, userId) {
    const { Shipment } = require('../models');
    const defaultShipment = {
      senderName: 'John Doe',
      receiverName: 'Jane Smith',
      origin: 'Lagos, Nigeria',
      destination: 'Abuja, Nigeria',
      createdBy: userId,
      ...shipmentData,
    };
    return Shipment.create(defaultShipment);
  },
};
