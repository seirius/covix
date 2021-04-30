import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CovixConfig } from './config/CovixConfig';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(CovixConfig.PORT);
}
bootstrap();
