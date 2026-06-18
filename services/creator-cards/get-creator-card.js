const { throwAppError } = require('@app-core/errors');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-cards');
const serializeCreatorCard = require('./serialize-creator-card');

async function getCreatorCard(serviceData, _options = {}) {
  const { slug, access_code: accessCode } = serviceData;

  const record = await CreatorCard.findOne({ query: { slug } });

  if (!record) {
    throwAppError(CreatorCardMessages.NOT_FOUND, 'NF01');
  }

  if (record.status === 'draft') {
    throwAppError(CreatorCardMessages.DRAFT_NOT_FOUND, 'NF02');
  }

  if (record.access_type === 'private') {
    if (!accessCode) {
      throwAppError(CreatorCardMessages.PRIVATE_REQUIRES_CODE, 'AC03');
    }
    if (accessCode !== record.access_code) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, 'AC04');
    }
  }

  return serializeCreatorCard(record, { includeAccessCode: false });
}

module.exports = getCreatorCard;
