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
} from 'class-validator';
import type { Format, Genre } from '@tournament/engine';

const FORMATS = ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'SWISS', 'FFA'];
const GENRES = ['DUEL', 'TEAM', 'FFA'];

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
  @IsBoolean()
  requireCheckIn?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxParticipants?: number;
}

export class RegisterDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;
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
