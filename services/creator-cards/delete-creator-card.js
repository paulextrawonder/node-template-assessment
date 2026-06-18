const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-cards');
const serializeCreatorCard = require('./serialize-creator-card');

const deleteSpec = `root {
  creator_reference string<length:20>
  slug string
}`;

const parsedDeleteSpec = validator.parse(deleteSpec);

async function deleteCreatorCard(serviceData, _options = {}) {
  const data = validator.validate(serviceData, parsedDeleteSpec);

  const record = await CreatorCard.findOne({ query: { slug: data.slug } });

  if (!record) {
    throwAppError(CreatorCardMessages.NOT_FOUND, 'NF01');
  }

  const deletedAt = Date.now();

  const response = serializeCreatorCard(record, {
    includeAccessCode: true,
    deletedOverride: deletedAt,
  });

  await CreatorCard.deleteOne({ query: { slug: data.slug } });

  return response;
}

module.exports = deleteCreatorCard;
