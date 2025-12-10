const request = require('supertest');
const app = require('../app');
const { Shipment } = require('../models');

describe('Shipment Endpoints', () => {
  let userToken;
  let adminToken;
  let userId;
  let adminId;

  beforeEach(async () => {
    const userResult = await testHelpers.createUser();
    userToken = userResult.token;
    userId = userResult.user._id;

    const adminResult = await testHelpers.createAdmin();
    adminToken = adminResult.token;
    adminId = adminResult.user._id;
  });

  describe('POST /api/shipments', () => {
    it('should create a shipment successfully', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          senderName: 'John Doe',
          receiverName: 'Jane Smith',
          origin: 'Lagos, Nigeria',
          destination: 'Abuja, Nigeria',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('trackingNumber');
      expect(res.body.data.senderName).toBe('John Doe');
      expect(res.body.data.status).toBe('pending');
    });

    it('should create shipment with all fields', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          senderName: 'John Doe',
          receiverName: 'Jane Smith',
          origin: 'Lagos, Nigeria',
          destination: 'Abuja, Nigeria',
          weight: 5.5,
          description: 'Electronics package',
          estimatedDelivery: futureDate.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.weight).toBe(5.5);
      expect(res.body.data.description).toBe('Electronics package');
    });

    it('should not create shipment without auth', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .send({
          senderName: 'John Doe',
          receiverName: 'Jane Smith',
          origin: 'Lagos',
          destination: 'Abuja',
        });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          senderName: 'John Doe',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should validate field lengths', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          senderName: 'J',
          receiverName: 'Jane Smith',
          origin: 'Lagos',
          destination: 'Abuja',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/shipments', () => {
    beforeEach(async () => {
      await testHelpers.createShipment({}, userId);
      await testHelpers.createShipment({ status: 'in_transit' }, userId);
      await testHelpers.createShipment({ status: 'delivered' }, userId);
    });

    it('should get all shipments for user', async () => {
      const res = await request(app)
        .get('/api/shipments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter shipments by status', async () => {
      const res = await request(app)
        .get('/api/shipments')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(s => s.status === 'pending')).toBe(true);
    });

    it('should search shipments', async () => {
      await testHelpers.createShipment({
        senderName: 'Unique Sender Name',
      }, userId);

      const res = await request(app)
        .get('/api/shipments')
        .query({ search: 'Unique' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/shipments')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.currentPage).toBe(1);
    });

    it('should sort shipments', async () => {
      const res = await request(app)
        .get('/api/shipments')
        .query({ sortBy: 'createdAt', sortOrder: 'asc' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      
      const dates = res.body.data.map(s => new Date(s.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBe(true);
      }
    });
  });

  describe('GET /api/shipments/:id', () => {
    it('should get shipment by id', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .get(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(shipment._id.toString());
    });

    it('should return 404 for non-existent shipment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const res = await request(app)
        .get(`/api/shipments/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 422 for invalid id format', async () => {
      const res = await request(app)
        .get('/api/shipments/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(422);
    });

    it('should not allow user to access other user shipment', async () => {
      const { user: otherUser } = await testHelpers.createUser({
        email: 'other@example.com',
      });
      const shipment = await testHelpers.createShipment({}, otherUser._id);

      const res = await request(app)
        .get(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to access any shipment', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .get(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/shipments/:id', () => {
    it('should update shipment successfully', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .put(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          senderName: 'Updated Sender',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.senderName).toBe('Updated Sender');
      expect(res.body.data.description).toBe('Updated description');
    });

    it('should not allow updating tracking number', async () => {
      const shipment = await testHelpers.createShipment({}, userId);
      const originalTracking = shipment.trackingNumber;

      const res = await request(app)
        .put(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          trackingNumber: 'NEW-TRACKING-123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.trackingNumber).toBe(originalTracking);
    });

    it('should validate update data', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .put(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'invalid_status',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/shipments/:id/status', () => {
    it('should update status successfully', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .patch(`/api/shipments/${shipment._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'in_transit',
          notes: 'Package picked up',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_transit');
      expect(res.body.data.statusHistory).toHaveLength(2);
    });

    it('should validate status transitions', async () => {
      const shipment = await testHelpers.createShipment({
        status: 'delivered',
      }, userId);

      const res = await request(app)
        .patch(`/api/shipments/${shipment._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'in_transit',
        });

      expect(res.status).toBe(400);
    });

    it('should set actual delivery date when delivered', async () => {
      const shipment = await testHelpers.createShipment({
        status: 'in_transit',
      }, userId);

      const res = await request(app)
        .patch(`/api/shipments/${shipment._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'delivered',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.actualDelivery).toBeDefined();
    });
  });

  describe('DELETE /api/shipments/:id', () => {
    it('should delete pending shipment', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .delete(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Shipment.findById(shipment._id);
      expect(deleted).toBeNull();
    });

    it('should not delete in_transit shipment (non-admin)', async () => {
      const shipment = await testHelpers.createShipment({
        status: 'in_transit',
      }, userId);

      const res = await request(app)
        .delete(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
    });

    it('should allow admin to delete any shipment', async () => {
      const shipment = await testHelpers.createShipment({
        status: 'in_transit',
      }, userId);

      const res = await request(app)
        .delete(`/api/shipments/${shipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/shipments/stats', () => {
    beforeEach(async () => {
      await testHelpers.createShipment({ status: 'pending' }, userId);
      await testHelpers.createShipment({ status: 'pending' }, userId);
      await testHelpers.createShipment({ status: 'in_transit' }, userId);
      await testHelpers.createShipment({ status: 'delivered' }, userId);
    });

    it('should get user statistics', async () => {
      const res = await request(app)
        .get('/api/shipments/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(4);
      expect(res.body.data.pending).toBe(2);
      expect(res.body.data.in_transit).toBe(1);
      expect(res.body.data.delivered).toBe(1);
    });
  });

  describe('GET /api/track/:trackingNumber (Public)', () => {
    it('should track shipment publicly without auth', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .get(`/api/track/${shipment.trackingNumber}`);

      expect(res.status).toBe(200);
      expect(res.body.data.trackingNumber).toBe(shipment.trackingNumber);
      expect(res.body.data.status).toBeDefined();
      expect(res.body.data.senderName).toBeDefined();
      expect(res.body.data.receiverName).toBeDefined();
    });

    it('should return 404 for non-existent tracking number', async () => {
      const res = await request(app)
        .get('/api/track/INVALID-TRACKING-123');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return limited information for public tracking', async () => {
      const shipment = await testHelpers.createShipment({
        description: 'Secret description',
      }, userId);

      const res = await request(app)
        .get(`/api/track/${shipment.trackingNumber}`);

      expect(res.status).toBe(200);
      // Public endpoint should not expose internal fields
      expect(res.body.data.createdBy).toBeUndefined();
    });
  });

  describe('GET /api/shipments/track/:trackingNumber (Authenticated)', () => {
    it('should get shipment by tracking number', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .get(`/api/shipments/track/${shipment.trackingNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.trackingNumber).toBe(shipment.trackingNumber);
    });

    it('should be case-insensitive', async () => {
      const shipment = await testHelpers.createShipment({}, userId);

      const res = await request(app)
        .get(`/api/shipments/track/${shipment.trackingNumber.toLowerCase()}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });
  });
});
