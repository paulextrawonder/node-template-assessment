function normalizeDeleted(deleted) {
  if (deleted === 0 || deleted === null || deleted === undefined) {
    return null;
  }
  return deleted;
}

function serializeCreatorCard(record, options = {}) {
  const { includeAccessCode = true, deletedOverride } = options;

  const data = {
    id: record._id,
    title: record.title,
    description: record.description,
    slug: record.slug,
    creator_reference: record.creator_reference,
    links: record.links || [],
    status: record.status,
    access_type: record.access_type,
    created: record.created,
    updated: record.updated,
    deleted: deletedOverride !== undefined ? deletedOverride : normalizeDeleted(record.deleted),
  };

  if (record.service_rates) {
    data.service_rates = record.service_rates;
  }

  if (includeAccessCode) {
    data.access_code = record.access_code || null;
  }

  return data;
}

module.exports = serializeCreatorCard;
