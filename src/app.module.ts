import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AvailabilityModule } from './modules/availabilities/availabilities.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PolciiesModule } from './modules/polciies/polciies.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AvailabilityModule,
    BlocksModule,
    BookingsModule,
    PolciiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
