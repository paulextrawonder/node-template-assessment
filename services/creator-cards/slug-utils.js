const crypto = require('crypto');

const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';

function isAllowedSlugChar(char) {
  const code = char.charCodeAt(0);
  const isDigit = code >= 48 && code <= 57;
  const isLower = code >= 97 && code <= 122;
  const isUpper = code >= 65 && code <= 90;
  return isDigit || isLower || isUpper || char === '-' || char === '_';
}

function isValidSlugCharset(slug) {
  for (let i = 0; i < slug.length; i += 1) {
    if (!isAllowedSlugChar(slug[i])) {
      return false;
    }
  }
  return true;
}

function filterSlugChars(value) {
  let filtered = '';
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (isAllowedSlugChar(char)) {
      if (char >= 'A' && char <= 'Z') {
        filtered += char.toLowerCase();
      } else {
        filtered += char;
      }
    }
  }
  return filtered;
}

function slugifyTitle(title) {
  const lower = title.toLowerCase();
  const parts = lower.split(' ');
  const joined = parts.join('-');
  return filterSlugChars(joined);
}

function generateRandomAlphanumeric(length) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return result;
}

async function slugExists(repository, slug) {
  const existing = await repository.findOne({ query: { slug } });
  return !!existing;
}

async function appendUniqueSuffix(base, repository, attempts = 0) {
  const slug = `${base}-${generateRandomAlphanumeric(6)}`;
  const exists = await slugExists(repository, slug);
  if (!exists || attempts >= 9) {
    return slug;
  }
  return appendUniqueSuffix(base, repository, attempts + 1);
}

async function resolveSlug({ title, providedSlug, repository }) {
  const clientProvided = !!providedSlug;

  if (clientProvided) {
    const slug = providedSlug;
    if (!isValidSlugCharset(slug)) {
      return { slug, clientProvided, invalidCharset: true };
    }
    if (await slugExists(repository, slug)) {
      return { slug, clientProvided, taken: true };
    }
    return { slug, clientProvided };
  }

  let slug = slugifyTitle(title);

  if (slug.length >= 5 && !(await slugExists(repository, slug))) {
    return { slug, clientProvided };
  }

  const base = slug.length < 5 ? slug || 'card' : slug;
  slug = await appendUniqueSuffix(base, repository);

  return { slug, clientProvided };
}

module.exports = {
  isValidSlugCharset,
  slugifyTitle,
  generateRandomAlphanumeric,
  slugExists,
  resolveSlug,
};
