/**
 * Pokémon core domain models and types.
 */

export type PokemonStatKey =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'specialAttack'
  | 'specialDefense'
  | 'speed';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  total: number;
}

export interface Pokemon {
  id: number;
  name: string;
  sprite: string;
  artwork: string;
  types: string[];
  stats: PokemonStats;
  height?: number;
  weight?: number;
}

export type SortOrder = 'asc' | 'desc';

export type SortField = keyof PokemonStats | 'name' | 'id';

export interface PokemonFilter {
  search: string;
  type: string;
  page: number;
  pageSize: number;
  sortField: SortField;
  sortOrder: SortOrder;
}

export interface PokemonListResponse {
  pokemons: Pokemon[];
  totalCount: number;
}

export interface TypeDistributionItem {
  type: string;
  count: number;
  percentage: number;
}

