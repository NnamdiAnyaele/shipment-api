const mongoose = require('mongoose');
require('dotenv').config();

const { User, Shipment } = require('../models');
const config = require('../config');
const { SHIPMENT_STATUS, USER_ROLES } = require('../utils/enums');

/**
 * Generate unique tracking number with counter to ensure uniqueness
 */
let trackingCounter = 0;
const generateTrackingNumber = () => {
  const prefix = 'SHP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const counter = (++trackingCounter).toString(36).toUpperCase().padStart(3, '0');
  return `${prefix}-${timestamp}${counter}-${random}`;
};

// Sample user data
const usersData = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: USER_ROLES.ADMIN,
  },
  {
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'password123',
    role: USER_ROLES.MANAGER,
  },
  {
    name: 'Regular User',
    email: 'user@example.com',
    password: 'password123',
    role: USER_ROLES.USER,
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: USER_ROLES.USER,
  },
];

// Sample locations
const origins = [
  'Lagos, Nigeria',
  'Abuja, Nigeria',
  'Port Harcourt, Nigeria',
  'Kano, Nigeria',
  'Ibadan, Nigeria',
];

const destinations = [
  'London, UK',
  'New York, USA',
  'Dubai, UAE',
  'Johannesburg, South Africa',
  'Accra, Ghana',
];

/**
 * Generate shipments for a specific user
 */
const generateShipmentsForUser = (userId, userName, userIndex) => {
  const statuses = Object.values(SHIPMENT_STATUS);
  const shipments = [];
  const numShipments = Math.floor(Math.random() * 6) + 5; // 5-10 shipments

  for (let i = 0; i < numShipments; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

    const estimatedDelivery = new Date(createdDate);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 14) + 3);

    const trackingNumber = generateTrackingNumber();

    const shipment = {
      trackingNumber,
      senderName: `${userName} (Sender)`,
      receiverName: `Receiver ${userIndex + 1}-${i + 1}`,
      origin: origins[Math.floor(Math.random() * origins.length)],
      destination: destinations[Math.floor(Math.random() * destinations.length)],
      status,
      weight: Math.round((Math.random() * 50 + 0.5) * 10) / 10,
      description: `Sample shipment ${i + 1} for ${userName}`,
      estimatedDelivery,
      createdBy: userId,
      createdAt: createdDate,
      statusHistory: [
        {
          status: SHIPMENT_STATUS.PENDING,
          changedAt: createdDate,
          changedBy: userId,
          notes: 'Shipment created',
        },
      ],
    };

    // Add status history entries for non-pending shipments
    if (status !== SHIPMENT_STATUS.PENDING) {
      const transitDate = new Date(createdDate);
      transitDate.setDate(transitDate.getDate() + 1);

      shipment.statusHistory.push({
        status: SHIPMENT_STATUS.IN_TRANSIT,
        changedAt: transitDate,
        changedBy: userId,
        notes: 'Package picked up and in transit',
      });

      if (status === SHIPMENT_STATUS.DELIVERED) {
        const deliveryDate = new Date(transitDate);
        deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 5) + 1);

        shipment.statusHistory.push({
          status: SHIPMENT_STATUS.DELIVERED,
          changedAt: deliveryDate,
          changedBy: userId,
          notes: 'Package delivered successfully',
        });
        shipment.actualDelivery = deliveryDate;
      }

      if (status === SHIPMENT_STATUS.CANCELLED) {
        shipment.statusHistory.push({
          status: SHIPMENT_STATUS.CANCELLED,
          changedAt: transitDate,
          changedBy: userId,
          notes: 'Shipment cancelled by customer',
        });
      }
    }

    shipments.push(shipment);
  }

  return shipments;
};

/**
 * Main seeding function
 */
async function seed() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           🌱 SHIPMENT API DATABASE SEEDER 🌱               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    console.log(`   URI: ${config.MONGODB_URI.replace(/\/\/.*@/, '//*****@')}`);
    await mongoose.connect(config.MONGODB_URI);
    console.log('   ✅ Connected successfully!\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    const deletedUsers = await User.deleteMany({});
    const deletedShipments = await Shipment.deleteMany({});
    console.log(`   • Deleted ${deletedUsers.deletedCount} users`);
    console.log(`   • Deleted ${deletedShipments.deletedCount} shipments`);
    console.log('   ✅ Database cleared!\n');

    // Create users
    console.log('═'.repeat(60));
    console.log('👥 CREATING USERS');
    console.log('═'.repeat(60));

    const createdUsers = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`\n   ✅ Created: ${user.name}`);
      console.log(`      • ID:    ${user._id}`);
      console.log(`      • Email: ${user.email}`);
      console.log(`      • Role:  ${user.role.toUpperCase()}`);
    }

    console.log('\n');
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│                    📋 USER CREDENTIALS                     │');
    console.log('├────────────────────────────────────────────────────────────┤');
    console.log('│  Role       │  Email                  │  Password          │');
    console.log('├────────────────────────────────────────────────────────────┤');
    usersData.forEach((user) => {
      const role = user.role.toUpperCase().padEnd(10);
      const email = user.email.padEnd(23);
      const password = user.password.padEnd(18);
      console.log(`│  ${role} │  ${email} │  ${password} │`);
    });
    console.log('└────────────────────────────────────────────────────────────┘');
    console.log('\n');

    // Create shipments for each user
    console.log('═'.repeat(60));
    console.log('📦 CREATING SHIPMENTS');
    console.log('═'.repeat(60));

    let totalShipments = 0;
    const allShipments = [];
    const userShipmentStats = [];

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      console.log(`\n   👤 ${user.name} (${user.email})`);
      console.log('   ' + '─'.repeat(50));

      const shipments = generateShipmentsForUser(user._id, user.name, i);
      const createdShipments = await Shipment.insertMany(shipments);
      allShipments.push(...createdShipments);

      // Calculate stats for this user
      const stats = {
        userName: user.name,
        total: createdShipments.length,
        pending: createdShipments.filter((s) => s.status === SHIPMENT_STATUS.PENDING).length,
        in_transit: createdShipments.filter((s) => s.status === SHIPMENT_STATUS.IN_TRANSIT).length,
        delivered: createdShipments.filter((s) => s.status === SHIPMENT_STATUS.DELIVERED).length,
        cancelled: createdShipments.filter((s) => s.status === SHIPMENT_STATUS.CANCELLED).length,
      };
      userShipmentStats.push(stats);

      console.log(`   ✅ Created ${createdShipments.length} shipments:`);
      console.log(`      • Pending:    ${stats.pending}`);
      console.log(`      • In Transit: ${stats.in_transit}`);
      console.log(`      • Delivered:  ${stats.delivered}`);
      console.log(`      • Cancelled:  ${stats.cancelled}`);

      // Log first 3 tracking numbers as samples
      console.log(`\n   📝 Sample Tracking Numbers:`);
      createdShipments.slice(0, 3).forEach((s, idx) => {
        console.log(`      ${idx + 1}. ${s.trackingNumber} (${s.status})`);
      });
      if (createdShipments.length > 3) {
        console.log(`      ... and ${createdShipments.length - 3} more`);
      }

      totalShipments += createdShipments.length;
    }

    // Overall statistics
    console.log('\n\n');
    console.log('═'.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('═'.repeat(60));

    const overallStats = {
      pending: allShipments.filter((s) => s.status === SHIPMENT_STATUS.PENDING).length,
      in_transit: allShipments.filter((s) => s.status === SHIPMENT_STATUS.IN_TRANSIT).length,
      delivered: allShipments.filter((s) => s.status === SHIPMENT_STATUS.DELIVERED).length,
      cancelled: allShipments.filter((s) => s.status === SHIPMENT_STATUS.CANCELLED).length,
    };

    console.log('\n   📈 Overall Statistics:');
    console.log('   ┌──────────────────────────────────────┐');
    console.log(`   │  Total Users:        ${createdUsers.length.toString().padStart(14)} │`);
    console.log(`   │  Total Shipments:    ${totalShipments.toString().padStart(14)} │`);
    console.log('   ├──────────────────────────────────────┤');
    console.log(`   │  Pending:            ${overallStats.pending.toString().padStart(14)} │`);
    console.log(`   │  In Transit:         ${overallStats.in_transit.toString().padStart(14)} │`);
    console.log(`   │  Delivered:          ${overallStats.delivered.toString().padStart(14)} │`);
    console.log(`   │  Cancelled:          ${overallStats.cancelled.toString().padStart(14)} │`);
    console.log('   └──────────────────────────────────────┘');

    console.log('\n   📦 Shipments Per User:');
    console.log('   ┌─────────────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐');
    console.log('   │ User                    │ Total   │ Pending │ Transit │ Deliver │ Cancel  │');
    console.log('   ├─────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤');
    userShipmentStats.forEach((stat) => {
      const name = stat.userName.substring(0, 23).padEnd(23);
      console.log(
        `   │ ${name} │ ${stat.total.toString().padStart(7)} │ ${stat.pending.toString().padStart(7)} │ ${stat.in_transit.toString().padStart(7)} │ ${stat.delivered.toString().padStart(7)} │ ${stat.cancelled.toString().padStart(7)} │`
      );
    });
    console.log('   └─────────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘');

    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          🎉 DATABASE SEEDING COMPLETED! 🎉                 ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  You can now start the server with: npm run dev            ║');
    console.log('║  API will be available at: http://localhost:3005           ║');
    console.log('║  Swagger docs at: http://localhost:3005/api-docs           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║              ❌ SEEDING FAILED! ❌                         ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('\n   Error Details:');
    console.error(`   • Message: ${error.message}`);
    if (error.errors) {
      console.error('   • Validation Errors:');
      Object.keys(error.errors).forEach((key) => {
        console.error(`     - ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('\n   Stack Trace:');
    console.error(`   ${error.stack}`);
    console.error('\n');

    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seeder
seed();