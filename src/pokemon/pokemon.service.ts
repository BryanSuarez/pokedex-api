import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoId } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private readonly defaultLimit: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit') ?? 10;
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          `Pokemon exists in db ${JSON.stringify(error.keyValue)}`,
        );
      }
      throw new InternalServerErrorException('Something went wrong', error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;
    return this.pokemonModel
      .find()
      .skip(offset)
      .limit(limit)
      .sort({ no: 1 })
      .select('-__v');
  }

  async findOne(term: string) {
    const pokemon = await this.pokemonModel.findOne({
      $or: [
        { name: term.toLowerCase() },
        { _id: isMongoId(term) ? term : null },
      ],
    });

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with term ${term} not found`);
    }
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      const pokemon = await this.pokemonModel.findOne({
        $or: [
          { name: term.toLowerCase() },
          { _id: isMongoId(term) ? term : null },
        ],
      });

      if (!pokemon) {
        throw new NotFoundException(`Pokemon with term ${term} not found`);
      }

      await this.pokemonModel.updateOne(
        { _id: pokemon._id },
        { $set: updatePokemonDto },
      );

      return {
        ...pokemon.toJSON(),
        ...updatePokemonDto,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(
          `Pokemon exists in db ${JSON.stringify(error.keyValue)}`,
        );
      }
      throw new InternalServerErrorException('Something went wrong', error);
    }
  }

  async remove(term: string) {
    const pokemon = await this.pokemonModel.findOne({
      $or: [
        { name: term.toLowerCase() },
        { _id: isMongoId(term) ? term : null },
      ],
    });

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with term ${term} not found`);
    }

    try {
      await this.pokemonModel.deleteOne({ _id: pokemon._id });
      return { message: `Pokemon with term ${term} has been deleted` };
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong', error);
    }
  }
}
