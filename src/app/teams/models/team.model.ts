import { PokemonStats, PokemonAbility } from '../../pokedex/models/pokemon.model';

/**
 * Team builder domain models and interfaces.
 */

export interface TeamMember {
  id: number;
  name: string;
  sprite: string;
  types: string[];
  stats: PokemonStats;
  abilities?: PokemonAbility[];
}

export interface Trainer {
  id: string;
  name: string;
  teams?: Team[];
}

export interface Team {
  id: string;
  name: string;
  trainer_id?: string | null;
  trainer?: Trainer | null;
  pokemons: TeamMember[];
  createdAt?: string;
  isOptimistic?: boolean;
}

export interface TeamInput {
  name: string;
  pokemons: TeamMember[];
  trainer_id?: string;
}
