import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Format, Genre } from '@tournament/engine';

const FORMATS = ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'SWISS', 'FFA', 'GROUP_STAGE'];
const GENRES = ['DUEL', 'TEAM', 'FFA'];

export class PrizeDto {
  @IsInt()
  @Min(1)
  rank!: number;

  @IsInt()
  @Min(0)
  amount!: number;
}

export class ScoringDto {
  @IsInt()
  win!: number;

  @IsInt()
  draw!: number;

  @IsInt()
  loss!: number;
}

export class CreateTournamentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  game?: string;

  @IsIn(FORMATS)
  format!: Format;

  @IsIn(GENRES)
  genre!: Genre;

  @IsOptional()
  @IsInt()
  @Min(1)
  ffaRounds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  swissRounds?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  groupSize?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  advancePerGroup?: number;

  @IsOptional()
  @IsBoolean()
  requireCheckIn?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxParticipants?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeDto)
  prizePool?: PrizeDto[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  streamUrl?: string;

  @IsOptional()
  @IsBoolean()
  requireResultConfirmation?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScoringDto)
  scoring?: ScoringDto;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  startAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;
}

export class RegisterDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  // نامِ نمایشیِ اختیاری داخلِ مسابقه؛ اگر داده شود، در براکت به‌جای نامِ کاربری دیده می‌شود.
  @IsOptional()
  @IsString()
  @MaxLength(32)
  inGameName?: string;
}

export class ReportDto {
  @IsOptional()
  @IsString()
  winnerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rankedIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  score?: string;
}
