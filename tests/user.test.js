const request = require('supertest');
const app = require('../app');

describe('User Management Endpoints (Admin Only)', () => {
  let adminToken;
  let userToken;
  let adminId;
  let targetUserId;

  beforeEach(async () => {
    const adminResult = await testHelpers.createAdmin({
      email: 'admin@example.com',
    });
    adminToken = adminResult.token;
    adminId = adminResult.user._id;

    const userResult = await testHelpers.createUser({
      email: 'user@example.com',
    });
    userToken = userResult.token;
    targetUserId = userResult.user._id;
  });

  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should not allow regular user to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ role: 'admin' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(u => u.role === 'admin')).toBe(true);
    });

    it('should filter users by active status', async () => {
      const res = await request(app)
        .get('/api/users')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(u => u.isActive === true)).toBe(true);
    });

    it('should search users by name or email', async () => {
      await testHelpers.createUser({
        name: 'Unique Test Name',
        email: 'unique@example.com',
      });

      const res = await request(app)
        .get('/api/users')
        .query({ search: 'Unique' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should allow admin to get user by id', async () => {
      const res = await request(app)
        .get(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(targetUserId.toString());
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should not allow regular user to get other users', async () => {
      const res = await request(app)
        .get(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should allow admin to update user role', async () => {
      const res = await request(app)
        .put(`/api/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'manager' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('manager');
    });

    it('should validate role value', async () => {
      const res = await request(app)
        .put(`/api/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role' });

      expect(res.status).toBe(422);
    });

    it('should not allow regular user to update roles', async () => {
      const res = await request(app)
        .put(`/api/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id/deactivate', () => {
    it('should deactivate user', async () => {
      const res = await request(app)
        .put(`/api/users/${targetUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should prevent deactivated user from logging in', async () => {
      await request(app)
        .put(`/api/users/${targetUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      expect(loginRes.status).toBe(403);
    });
  });

  describe('PUT /api/users/:id/activate', () => {
    it('should activate user', async () => {
      // First deactivate
      await request(app)
        .put(`/api/users/${targetUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Then activate
      const res = await request(app)
        .put(`/api/users/${targetUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const res = await request(app)
        .delete(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(404);
    });

    it('should not allow regular user to delete users', async () => {
      const res = await request(app)
        .delete(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
