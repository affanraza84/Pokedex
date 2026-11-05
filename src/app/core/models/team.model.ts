import { PokemonStats } from './pokemon.model';

/**
 * Team builder domain models.
 */

export interface TeamMember {
  id: number;
  name: string;
  sprite: string;
  types: string[];
  stats: PokemonStats;
}

export interface Team {
  id: string;
  name: string;
  pokemons: TeamMember[];
  createdAt?: string;
  isOptimistic?: boolean;
}

export interface TeamInput {
  name: string;
  pokemons: TeamMember[];
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

