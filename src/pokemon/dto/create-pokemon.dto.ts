import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePokemonDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsNumber()
  @IsPositive()
  @IsInt()
  no: number;
}
