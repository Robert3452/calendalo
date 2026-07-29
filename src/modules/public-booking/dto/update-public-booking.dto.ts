import { PartialType } from '@nestjs/swagger';
import { CreatePublicBookingDto } from './create-public-booking.dto';

export class UpdatePublicBookingDto extends PartialType(
  CreatePublicBookingDto,
) {}
