const { throwAppError } = require('@app-core/errors');

function isValidUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function isAlphanumeric(value) {
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    const code = char.charCodeAt(0);
    const isDigit = code >= 48 && code <= 57;
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isDigit && !isUpper && !isLower) {
      return false;
    }
  }
  return true;
}

function validateLinks(links) {
  if (!links || !links.length) {
    return;
  }
  links.forEach((link, index) => {
    if (!isValidUrl(link.url)) {
      throwAppError(`links.${index}.url must start with http:// or https://`, 'VALIDATION_ERROR');
    }
  });
}

function validateServiceRates(serviceRates) {
  if (!serviceRates) {
    return;
  }
  if (!serviceRates.rates || !serviceRates.rates.length) {
    throwAppError('service_rates.rates must be a non-empty array', 'VALIDATION_ERROR');
  }
  serviceRates.rates.forEach((rate, index) => {
    if (!Number.isInteger(rate.amount) || rate.amount < 1) {
      throwAppError(
        `service_rates.rates.${index}.amount must be a positive integer`,
        'VALIDATION_ERROR'
      );
    }
  });
}

function validateAccessCode(accessCode) {
  if (accessCode && !isAlphanumeric(accessCode)) {
    throwAppError('access_code must be exactly 6 alphanumeric characters', 'VALIDATION_ERROR');
  }
}

module.exports = {
  isValidUrl,
  isAlphanumeric,
  validateLinks,
  validateServiceRates,
  validateAccessCode,
};
