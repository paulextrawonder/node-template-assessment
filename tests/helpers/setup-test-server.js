const mongoose = require('mongoose');
const { createConnection } = require('@app-core/mongoose');
const createMockServer = require('@app-core/mock-server');

async function resetCreatorCards() {
  if (!mongoose.connection?.db) {
    return;
  }
  await mongoose.connection.db.dropCollection('creator_cards').catch(() => {});
}

async function setupTestServer() {
  process.env.USE_MOCK_MODEL = '0';

  const testUri =
    process.env.MONGODB_TEST_URI ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/assessment_test';

  await createConnection({ uri: testUri });
  await resetCreatorCards();

  const api = createMockServer(['./endpoints/creator-cards/']);

  return { api, resetCreatorCards };
}

async function teardownTestServer() {
  await mongoose.disconnect();
}

module.exports = { setupTestServer, teardownTestServer, resetCreatorCards };
