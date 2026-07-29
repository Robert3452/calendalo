import { PartialType } from '@nestjs/mapped-types';
import { UpsertPolciyDto } from './create-polciy.dto';

export class UpdatePolciyDto extends PartialType(UpsertPolciyDto) {}
