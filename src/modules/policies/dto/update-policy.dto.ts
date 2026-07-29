import { PartialType } from '@nestjs/mapped-types';
import { UpsertPolciyDto } from './create-policy.dto';

export class UpdatePolciyDto extends PartialType(UpsertPolciyDto) {}
