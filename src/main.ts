import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aumenta el límite del body parser para JSON y urlencoded
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

  // Configuración de CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('CityxGov API')
    .setDescription('API para la gestión de usuarios y recursos de CityxGov')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
