const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-cards');
const serializeCreatorCard = require('./serialize-creator-card');
const { resolveSlug } = require('./slug-utils');
const { validateLinks, validateServiceRates, validateAccessCode } = require('./validation-utils');

const createSpec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|lowercase|lengthBetween:5,50>
  creator_reference string<length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateSpec = validator.parse(createSpec);

async function createCreatorCard(serviceData, _options = {}) {
  const data = validator.validate(serviceData, parsedCreateSpec);

  const accessType = data.access_type || 'public';

  if (accessType === 'private' && !data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, 'AC01');
  }

  if (accessType === 'public' && data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_ON_PUBLIC, 'AC05');
  }

  validateLinks(data.links);
  validateServiceRates(data.service_rates);
  validateAccessCode(data.access_code);

  const slugResult = await resolveSlug({
    title: data.title,
    providedSlug: data.slug,
    repository: CreatorCard,
  });

  if (slugResult.taken) {
    throwAppError(CreatorCardMessages.SLUG_TAKEN, 'SL02');
  }

  if (slugResult.invalidCharset) {
    throwAppError('slug contains invalid characters', 'VALIDATION_ERROR');
  }

  const recordData = {
    title: data.title,
    description: data.description,
    slug: slugResult.slug,
    creator_reference: data.creator_reference,
    links: data.links || [],
    service_rates: data.service_rates,
    status: data.status,
    access_type: accessType,
    access_code: accessType === 'private' ? data.access_code : null,
  };

  const record = await CreatorCard.create(recordData);

  return serializeCreatorCard(record, { includeAccessCode: true });
}

module.exports = createCreatorCard;
