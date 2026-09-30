import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AvailabilityModule } from './modules/availabilities/availabilities.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PublicBookingModule } from './modules/public-booking/public-booking.module';
import { ChatwootModule } from './modules/chatwoot/chatwoot.module';
import { ChatwootApiService } from './modules/chatwoot/chatwoot-api.service';
import { AiModule } from './modules/ai/ai.module';
import { RedisModule } from './modules/redis/redis.module';
import { ConversationStore } from './modules/redis/conversationStore';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AvailabilityModule,
    BlocksModule,
    BookingsModule,
    PoliciesModule,
    AccountsModule,
    PublicBookingModule,
    ChatwootModule,

    AiModule,

    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatwootApiService, ConversationStore],
})
export class AppModule {}
