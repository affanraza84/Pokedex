import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from '../../core/services/graphql.service';
import {
  GET_POKEMON_LIST_QUERY,
  GET_POKEMON_BY_ID_QUERY,
  GET_POKEMON_TYPES_QUERY
} from './pokeapi.queries';
import {
  Pokemon,
  PokemonAbility,
  PokemonFilter,
  PokemonListResponse,
  PokemonStats
} from '../models/pokemon.model';

interface PokeApiStatNode {
  base_stat: number;
  pokemon_v2_stat: { id: number; name: string };
}

interface PokeApiTypeNode {
  pokemon_v2_type: { id: number; name: string };
}

interface PokeApiAbilityNode {
  is_hidden: boolean;
  slot?: number;
  pokemon_v2_ability: { id: number; name: string };
}

interface PokeApiPokemonNode {
  id: number;
  name: string;
  height?: number;
  weight?: number;
  pokemon_v2_pokemonsprites: Array<{ sprites: string | Record<string, unknown> }>;
  pokemon_v2_pokemontypes: PokeApiTypeNode[];
  pokemon_v2_pokemonstats: PokeApiStatNode[];
  pokemon_v2_pokemonabilities: PokeApiAbilityNode[];
}

interface PokeApiListResponse {
  pokemon_v2_pokemon: PokeApiPokemonNode[];
  pokemon_v2_pokemon_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

interface PokeApiDetailResponse {
  pokemon_v2_pokemon_by_pk: PokeApiPokemonNode | null;
}

/**
 * Dedicated service for public PokéAPI GraphQL operations.
 * Endpoint: https://beta.pokeapi.co/graphql/v1beta
 *
 * Implements exponential backoff retries, response normalization,
 * and passes typed errors to consumers without silently swallowing them.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonApiService {
  private readonly graphqlService = inject(GraphQLService);
  public readonly pokeApiEndpoint = 'https://beta.pokeapi.co/graphql/v1beta';

  /**
   * Fetches a paginated, filtered, and sorted list of Pokémon from PokéAPI GraphQL.
   *
   * @param filter Pagination, search, type, and sort parameters.
   * @returns Observable emitting the normalized Pokémon list and total count.
   * @throws GraphQLError | GraphQLNetworkError | GraphQLHttpError
   */
  public getPokemons(filter: PokemonFilter): Observable<PokemonListResponse> {
    const limit = filter.pageSize;
    const offset = (filter.page - 1) * filter.pageSize;

    // Build GraphQL 'where' condition
    const whereConditions: Record<string, unknown> = {};
    if (filter.search && filter.search.trim()) {
      whereConditions['name'] = { _ilike: `%${filter.search.trim().toLowerCase()}%` };
    }
    if (filter.type) {
      whereConditions['pokemon_v2_pokemontypes'] = {
        pokemon_v2_type: { name: { _eq: filter.type.toLowerCase() } }
      };
    }

    // Build GraphQL 'order_by' condition
    const orderBy: Array<Record<string, unknown>> = [];
    if (filter.sortField === 'name' || filter.sortField === 'id') {
      orderBy.push({ [filter.sortField]: filter.sortOrder });
    } else {
      orderBy.push({ id: 'asc' });
    }

    const variables = {
      limit,
      offset,
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      order_by: orderBy.length > 0 ? orderBy : [{ id: 'asc' }]
    };

    return this.graphqlService
      .execute<PokeApiListResponse>(this.pokeApiEndpoint, GET_POKEMON_LIST_QUERY, variables, {
        retries: 3,
        retryDelayMs: 1000
      })
      .pipe(
        map(data => {
          const pokemons = data.pokemon_v2_pokemon.map(node => this.normalizePokemon(node));
          const totalCount = data.pokemon_v2_pokemon_aggregate?.aggregate?.count ?? pokemons.length;
          return { pokemons, totalCount };
        })
      );
  }

  /**
   * Retrieves single Pokémon details by its PokéAPI ID.
   *
   * @param id The Pokémon numeric ID.
   * @returns Observable emitting the normalized Pokemon or throwing if not found.
   */
  public getPokemonById(id: number): Observable<Pokemon> {
    return this.graphqlService
      .execute<PokeApiDetailResponse>(
        this.pokeApiEndpoint,
        GET_POKEMON_BY_ID_QUERY,
        { id },
        { retries: 3, retryDelayMs: 1000 }
      )
      .pipe(
        map(data => {
          if (!data.pokemon_v2_pokemon_by_pk) {
            throw new Error(`Pokémon with ID #${id} not found.`);
          }
          return this.normalizePokemon(data.pokemon_v2_pokemon_by_pk);
        })
      );
  }

  /**
   * Fetches all official Pokémon types from PokéAPI GraphQL.
   *
   * @returns Observable of type name strings.
   */
  public getTypes(): Observable<string[]> {
    return this.graphqlService
      .execute<{ pokemon_v2_type: Array<{ id: number; name: string }> }>(
        this.pokeApiEndpoint,
        GET_POKEMON_TYPES_QUERY,
        undefined,
        { retries: 2, retryDelayMs: 500 }
      )
      .pipe(
        map(data =>
          data.pokemon_v2_type
            .map(t => t.name)
            .filter(t => t !== 'unknown' && t !== 'shadow')
        )
      );
  }

  /**
   * Normalizes a raw GraphQL node into the application's domain model.
   */
  public normalizePokemon(node: PokeApiPokemonNode): Pokemon {
    const stats = this.extractStats(node.pokemon_v2_pokemonstats);
    const types = node.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name);
    const abilities = this.extractAbilities(node.pokemon_v2_pokemonabilities);

    let spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${node.id}.png`;
    let artworkUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png`;

    try {
      const rawSprites = node.pokemon_v2_pokemonsprites?.[0]?.sprites;
      if (rawSprites) {
        const parsed = typeof rawSprites === 'string' ? JSON.parse(rawSprites) : rawSprites;
        if (parsed.front_default) spriteUrl = parsed.front_default;
        if (parsed.other?.['official-artwork']?.front_default) {
          artworkUrl = parsed.other['official-artwork'].front_default;
        }
      }
    } catch {
      // Keep robust defaults
    }

    return {
      id: node.id,
      name: node.name,
      height: node.height,
      weight: node.weight,
      sprite: spriteUrl,
      artwork: artworkUrl,
      types,
      stats,
      abilities
    };
  }

  /**
   * Extracts and computes stat values from the GraphQL stats array.
   */
  private extractStats(statNodes: PokeApiStatNode[]): PokemonStats {
    const statMap: Record<string, number> = {};
    for (const s of statNodes) {
      statMap[s.pokemon_v2_stat.name] = s.base_stat;
    }

    const hp = statMap['hp'] ?? 0;
    const attack = statMap['attack'] ?? 0;
    const defense = statMap['defense'] ?? 0;
    const specialAttack = statMap['special-attack'] ?? 0;
    const specialDefense = statMap['special-defense'] ?? 0;
    const speed = statMap['speed'] ?? 0;
    const total = hp + attack + defense + specialAttack + specialDefense + speed;

    return { hp, attack, defense, specialAttack, specialDefense, speed, total };
  }

  /**
   * Extracts abilities from the GraphQL abilities array.
   */
  private extractAbilities(abilityNodes: PokeApiAbilityNode[]): PokemonAbility[] {
    if (!abilityNodes) return [];
    return abilityNodes.map(node => ({
      name: node.pokemon_v2_ability.name,
      isHidden: node.is_hidden,
      slot: node.slot
    }));
  }
}
