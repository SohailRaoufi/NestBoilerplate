import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export function setupSwagger(app: INestApplication<any>) {
  const swaggerConfigs = new DocumentBuilder()
    .setTitle('BoilerPlate API')
    .setDescription('BoilerPlate Description')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: true,
      name: 'X-Device-Id',
      schema: { example: crypto.randomUUID() },
    })
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfigs);

  app.use(
    '/docs',
    apiReference({
      content: swaggerDocument,
    }),
  );
}
