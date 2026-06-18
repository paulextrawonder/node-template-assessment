const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./openapi-spec');

function setupSwagger(server) {
  server.use('/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });
  server.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'Creator Card API' })
  );
}

module.exports = setupSwagger;
