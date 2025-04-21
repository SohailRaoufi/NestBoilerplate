import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication<any>) {
  const swaggerConfigs = new DocumentBuilder()
    .setTitle('Baran API')
    .setDescription('Baran Description')
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
  SwaggerModule.setup(
    process.env.SWAGGER_PATH || 'docs',
    app,
    swaggerDocument,
    {
      swaggerOptions: { defaultModelsExpandDepth: -1 },
    },
  );
}
