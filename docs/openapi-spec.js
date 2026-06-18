const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';

const creatorCardSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '01JG8XYZA2B3C4D5E6F7G8H9J0' },
    title: { type: 'string', example: 'George Cooks' },
    description: { type: 'string', example: 'George Cooks is a weekly cooking podcast' },
    slug: { type: 'string', example: 'george-cooks' },
    creator_reference: { type: 'string', example: 'crt_8f2k1m9x4p7w3q5z' },
    links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    service_rates: {
      type: 'object',
      properties: {
        currency: { type: 'string', enum: ['NGN', 'USD', 'GBP', 'GHS'] },
        rates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              amount: { type: 'integer' },
            },
          },
        },
      },
    },
    status: { type: 'string', enum: ['draft', 'published'] },
    access_type: { type: 'string', enum: ['public', 'private'] },
    access_code: { type: 'string', nullable: true },
    created: { type: 'integer' },
    updated: { type: 'integer' },
    deleted: { type: 'integer', nullable: true },
  },
};

const successResponse = (message) => ({
  type: 'object',
  properties: {
    status: { type: 'string', example: 'success' },
    message: { type: 'string', example: message },
    data: creatorCardSchema,
  },
});

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Creator Card API',
    description:
      'REST API for creating, retrieving, and deleting shareable creator profile cards with links and service rates.',
    version: '1.0.0',
  },
  servers: [{ url: baseUrl }],
  paths: {
    '/creator-cards': {
      post: {
        tags: ['Creator Cards'],
        summary: 'Create a creator card',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'creator_reference', 'status'],
                properties: {
                  title: { type: 'string', minLength: 3, maxLength: 100 },
                  description: { type: 'string', maxLength: 500 },
                  slug: {
                    type: 'string',
                    minLength: 5,
                    maxLength: 50,
                    description: 'Optional. Auto-generated from title if omitted.',
                  },
                  creator_reference: { type: 'string', minLength: 20, maxLength: 20 },
                  links: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['title', 'url'],
                      properties: {
                        title: { type: 'string' },
                        url: { type: 'string' },
                      },
                    },
                  },
                  service_rates: {
                    type: 'object',
                    properties: {
                      currency: { type: 'string', enum: ['NGN', 'USD', 'GBP', 'GHS'] },
                      rates: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            amount: { type: 'integer', minimum: 1 },
                          },
                        },
                      },
                    },
                  },
                  status: { type: 'string', enum: ['draft', 'published'] },
                  access_type: { type: 'string', enum: ['public', 'private'], default: 'public' },
                  access_code: {
                    type: 'string',
                    minLength: 6,
                    maxLength: 6,
                    description: 'Required when access_type is private.',
                  },
                },
              },
              example: {
                title: 'George Cooks',
                description: 'Weekly cooking podcast',
                slug: 'george-cooks',
                creator_reference: 'crt_8f2k1m9x4p7w3q5z',
                links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
                service_rates: {
                  currency: 'NGN',
                  rates: [
                    { name: 'IG Story Post', description: 'One story mention', amount: 5000000 },
                  ],
                },
                status: 'published',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Creator card created',
            content: {
              'application/json': {
                schema: successResponse('Creator Card Created Successfully.'),
              },
            },
          },
          400: {
            description: 'Validation or business rule error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    code: { type: 'string', example: 'SL02' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/creator-cards/{slug}': {
      get: {
        tags: ['Creator Cards'],
        summary: 'Retrieve a creator card by slug',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'george-cooks',
          },
          {
            name: 'access_code',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Required for private cards.',
          },
        ],
        responses: {
          200: {
            description: 'Creator card retrieved (access_code omitted)',
            content: {
              'application/json': {
                schema: successResponse('Creator Card Retrieved Successfully.'),
              },
            },
          },
          403: {
            description: 'Private card access denied',
            content: {
              'application/json': {
                oneOf: [
                  {
                    example: {
                      status: 'error',
                      message: 'This card is private. An access code is required',
                      code: 'AC03',
                    },
                  },
                  { example: { status: 'error', message: 'Invalid access code', code: 'AC04' } },
                ],
              },
            },
          },
          404: {
            description: 'Not found or draft',
            content: {
              'application/json': {
                oneOf: [
                  { example: { status: 'error', message: 'Creator card not found', code: 'NF01' } },
                  { example: { status: 'error', message: 'Creator card not found', code: 'NF02' } },
                ],
              },
            },
          },
        },
      },
      delete: {
        tags: ['Creator Cards'],
        summary: 'Delete a creator card by slug',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'george-cooks',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['creator_reference'],
                properties: {
                  creator_reference: { type: 'string', minLength: 20, maxLength: 20 },
                },
              },
              example: { creator_reference: 'crt_8f2k1m9x4p7w3q5z' },
            },
          },
        },
        responses: {
          200: {
            description: 'Creator card deleted',
            content: {
              'application/json': {
                schema: successResponse('Creator Card Deleted Successfully.'),
              },
            },
          },
          404: {
            description: 'Card not found',
            content: {
              'application/json': {
                example: { status: 'error', message: 'Creator card not found', code: 'NF01' },
              },
            },
          },
        },
      },
    },
  },
};
