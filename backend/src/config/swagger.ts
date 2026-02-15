import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mandes Snack API',
      version: '1.0.0',
      description: 'Dokumentasi API E-commerce',
    },
    servers: [
      {
        url: process.env.SWAGGER_BASE_URL || 'https://mandessnack.shop/api', // Sesuaikan jika port beda
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'mandes_token',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options);