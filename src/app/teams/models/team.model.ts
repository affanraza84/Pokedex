import { PokemonStats } from '../../pokedex/models/pokemon.model';

/**
 * Team builder domain models and interfaces.
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

