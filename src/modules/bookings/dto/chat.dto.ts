import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ChatDto {
  @IsString()
  message!: string;
  @IsString()
  accountId!: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}

export class ChatMessageDto {
  @IsIn(['user', 'assistant', 'tool'])
  role!: 'user' | 'assistant' | 'tool';

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsArray()
  tool_calls?: unknown[];

  @IsOptional()
  @IsString()
  reasoning?: string;

  @IsOptional()
  @IsString()
  tool_call_id?: string;
}
