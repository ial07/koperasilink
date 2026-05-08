import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['log', 'error', 'warn', 'debug', 'verbose'] 
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  if (process.env.NODE_ENV === 'production') {
    app.useLogger(console); // Basic fallback, would be replaced by Winston in full setup
  }

  // Security Headers
  app.use(helmet());

  app.setGlobalPrefix("api/v1");

  // Dynamic CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(4000);
  console.log("🚀 API running on http://localhost:4000/api/v1");
}
bootstrap();
