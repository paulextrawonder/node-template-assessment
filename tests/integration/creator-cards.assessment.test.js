const { expect } = require('chai');
const { setupTestServer, teardownTestServer } = require('../helpers/setup-test-server');

describe('Creator Card API — Assessment scenarios', () => {
  /** @type {import('@app-core/mock-server')} */
  let api;

  before(async () => {
    ({ api } = await setupTestServer());
  });

  after(async () => {
    await teardownTestServer();
  });

  describe('valid scenarios', () => {
    it('TC1: creates a full published card with public access default', async () => {
      const res = await api.post('/creator-cards', {
        body: {
          title: 'George Cooks',
          description: 'Weekly cooking podcast',
          slug: 'george-cooks',
          creator_reference: 'crt_8f2k1m9x4p7w3q5z',
          links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
          service_rates: {
            currency: 'NGN',
            rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
          },
          status: 'published',
        },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.data.status).to.equal('success');
      expect(res.data.data.access_type).to.equal('public');
      expect(res.data.data.id).to.be.a('string');
      expect(res.data.data).to.not.have.property('_id');
      expect(res.data.data.slug).to.equal('george-cooks');
    });

    it('TC2: auto-generates slug from title', async () => {
      const res = await api.post('/creator-cards', {
        body: {
          title: 'Ada Designs Things',
          creator_reference: 'crt_a1b2c3d4e5f6g7h8',
          status: 'published',
        },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.data.data.slug).to.equal('ada-designs-things');
    });

    it('TC3: creates a private card and returns access_code', async () => {
      const res = await api.post('/creator-cards', {
        body: {
          title: 'VIP Rate Card',
          creator_reference: 'crt_x9y8z7w6v5u4t3s2',
          status: 'published',
          access_type: 'private',
          access_code: 'A1B2C3',
        },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.data.data.access_code).to.equal('A1B2C3');
      expect(res.data.data.slug).to.equal('vip-rate-card');
    });

    it('TC4: retrieves a public published card without access_code', async () => {
      const res = await api.get('/creator-cards/george-cooks');

      expect(res.statusCode).to.equal(200);
      expect(res.data.status).to.equal('success');
      expect(res.data.data).to.not.have.property('access_code');
      expect(res.data.data.id).to.be.a('string');
    });

    it('TC5: retrieves a private card with correct access_code query param', async () => {
      const res = await api.get('/creator-cards/vip-rate-card', {
        query: { access_code: 'A1B2C3' },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.data.data).to.not.have.property('access_code');
    });

    it('TC6: deletes a card and returns deleted timestamp', async () => {
      const res = await api.delete('/creator-cards/ada-designs-things', {
        body: { creator_reference: 'crt_a1b2c3d4e5f6g7h8' },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.data.status).to.equal('success');
      expect(res.data.data.deleted).to.be.a('number').and.greaterThan(0);
      expect(res.data.data).to.have.property('access_code');
    });
  });

  describe('invalid scenarios', () => {
    it('TC7: rejects duplicate slug with SL02', async () => {
      const res = await api.post('/creator-cards', {
        body: {
          title: 'Another George',
          slug: 'george-cooks',
          creator_reference: 'crt_m1n2b3v4c5x6z7l8',
          status: 'published',
        },
      });

      expect(res.statusCode).to.equal(400);
      expect(res.data.code).to.equal('SL02');
    });

    it('TC8: rejects private card without access_code with AC01', async () => {
      const res = await api.post('/creator-cards', {
        body: {
          title: 'Secret Card',
          creator_reference: 'crt_q1w2e3r4t5y6u7i8',
          status: 'published',
          access_type: 'private',
        },
      });

      expect(res.statusCode).to.equal(400);
      expect(res.data.code).to.equal('AC01');
    });

    it('TC9: rejects public card with access_code with AC05', async () => {
      const res = await api.post('/creator-cards', {
        body: {
          title: 'Public Card',
          creator_reference: 'crt_q1w2e3r4t5y6u7i8',
          status: 'published',
          access_type: 'public',
          access_code: 'A1B2C3',
        },
      });

      expect(res.statusCode).to.equal(400);
      expect(res.data.code).to.equal('AC05');
    });

    it('TC10: rejects invalid status via validator with HTTP 400', async () => {
      const res = await api.post('/creator-cards', {
        body: {
          title: 'Bad Status Card',
          creator_reference: 'crt_q1w2e3r4t5y6u7i8',
          status: 'archived',
        },
      });

      expect(res.statusCode).to.equal(400);
      expect(res.data.status).to.equal('error');
    });

    it('TC11: returns NF01 for non-existent card', async () => {
      const res = await api.get('/creator-cards/does-not-exist-123');

      expect(res.statusCode).to.equal(404);
      expect(res.data.code).to.equal('NF01');
    });

    it('TC12: returns NF02 for draft card on public endpoint', async () => {
      await api.post('/creator-cards', {
        body: {
          title: 'My Draft Card',
          slug: 'my-draft-card',
          creator_reference: 'crt_d1r2a3f4t5c6a7r8',
          status: 'draft',
        },
      });

      const res = await api.get('/creator-cards/my-draft-card');

      expect(res.statusCode).to.equal(404);
      expect(res.data.code).to.equal('NF02');
    });

    it('TC13: returns AC03 when private card accessed without pin', async () => {
      const res = await api.get('/creator-cards/vip-rate-card');

      expect(res.statusCode).to.equal(403);
      expect(res.data.code).to.equal('AC03');
    });

    it('TC14: returns AC04 for wrong access_code', async () => {
      const res = await api.get('/creator-cards/vip-rate-card', {
        query: { access_code: 'WRONG1' },
      });

      expect(res.statusCode).to.equal(403);
      expect(res.data.code).to.equal('AC04');
    });

    it('TC15: returns NF01 when deleting non-existent card', async () => {
      const res = await api.delete('/creator-cards/does-not-exist-123', {
        body: { creator_reference: 'crt_q1w2e3r4t5y6u7i8' },
      });

      expect(res.statusCode).to.equal(404);
      expect(res.data.code).to.equal('NF01');
    });

    it('TC16: returns NF01 when retrieving a deleted card', async () => {
      const res = await api.get('/creator-cards/ada-designs-things');

      expect(res.statusCode).to.equal(404);
      expect(res.data.code).to.equal('NF01');
    });
  });
});
