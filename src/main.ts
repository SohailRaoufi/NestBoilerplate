import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfigs, corsConfigs } from './configs/app.config';
import { setupSwagger } from './configs/swagger.config';
import { validationOptions } from './configs/validation.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, appConfigs);

  app.enableCors(corsConfigs);

  app.useGlobalPipes(new ValidationPipe(validationOptions));

  /**
   * Swagger setup for API documentation
   */
  if (process.env.SWAGGER_ENABLED === 'true') {
    setupSwagger(app);
  }

  /**
   * Enable shutdown hooks to handle graceful shutdown, ensuring resources properly closed.
   */
  app.enableShutdownHooks();

  /**
   * Start the application
   */
  app.listen(process.env.ADMIN_PORT || 3000).then(async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Server is running on ${await app.getUrl()}`);
    }
  });
}
bootstrap();
