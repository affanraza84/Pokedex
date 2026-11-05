import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GraphQLService } from '../../core/services/graphql.service';
import { GET_POKEMON_LIST_QUERY, GET_POKEMON_TYPES_QUERY } from './pokeapi.queries';
import { Pokemon, PokemonFilter, PokemonListResponse, PokemonStats } from '../models/pokemon.model';
import { FALLBACK_POKEMONS, POKEMON_TYPES } from '../../core/data/pokemon-fallback.data';

interface PokeApiStatNode {
  base_stat: number;
  pokemon_v2_stat: { name: string };
}

interface PokeApiTypeNode {
  pokemon_v2_type: { name: string };
}

interface PokeApiPokemonNode {
  id: number;
  name: string;
  height?: number;
  weight?: number;
  pokemon_v2_pokemonsprites: Array<{ sprites: string | Record<string, unknown> }>;
  pokemon_v2_pokemontypes: PokeApiTypeNode[];
  pokemon_v2_pokemonstats: PokeApiStatNode[];
}

interface PokeApiListResponse {
  pokemon_v2_pokemon: PokeApiPokemonNode[];
  pokemon_v2_pokemon_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

/**
 * Service for querying Pokémon data from the PokéAPI GraphQL endpoint.
 * Features retry handling, response normalization, and an offline fallback.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonApiService {
  private readonly graphqlService = inject(GraphQLService);
  private readonly pokeApiEndpoint = 'https://beta.pokeapi.co/graphql/v1beta';

  /**
   * Fetches a paginated, filtered, and sorted list of Pokémon from PokéAPI GraphQL.
   *
   * @param filter Filter, pagination, and sorting parameters.
   * @returns Observable emitting the normalized Pokémon list and total count.
   */
  public getPokemons(filter: PokemonFilter): Observable<{ response: PokemonListResponse; fromFallback: boolean }> {
    const limit = filter.pageSize;
    const offset = (filter.page - 1) * filter.pageSize;

    // Build GraphQL 'where' condition
    const whereConditions: Record<string, unknown> = {};
    if (filter.search.trim()) {
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
          return {
            response: { pokemons, totalCount },
            fromFallback: false
          };
        }),
        catchError(error => {
          console.warn(
            '[PokemonApiService] PokéAPI GraphQL request failed or network blocked; activating fallback dataset:',
            error.message
          );
          return of({
            response: this.filterFallbackDataset(filter),
            fromFallback: true
          });
        })
      );
  }

  /**
   * Fetches all available Pokémon types.
   *
   * @returns Observable emitting the list of type names.
   */
  public getTypes(): Observable<string[]> {
    return this.graphqlService
      .execute<{ pokemon_v2_type: Array<{ name: string }> }>(
        this.pokeApiEndpoint,
        GET_POKEMON_TYPES_QUERY,
        undefined,
        { retries: 2, retryDelayMs: 500 }
      )
      .pipe(
        map(data => data.pokemon_v2_type.map(t => t.name).filter(t => t !== 'unknown' && t !== 'shadow')),
        catchError(() => of(POKEMON_TYPES))
      );
  }

  /**
   * Normalizes a raw GraphQL node into the application's Pokemon domain model.
   */
  private normalizePokemon(node: PokeApiPokemonNode): Pokemon {
    const stats = this.extractStats(node.pokemon_v2_pokemonstats);
    const types = node.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name);

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
      // Defaults
    }

    return {
      id: node.id,
      name: node.name,
      height: node.height,
      weight: node.weight,
      sprite: spriteUrl,
      artwork: artworkUrl,
      types,
      stats
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
   * Client-side filter, sort, and pagination of fallback data.
   */
  private filterFallbackDataset(filter: PokemonFilter): PokemonListResponse {
    let result = [...FALLBACK_POKEMONS];

    if (filter.search.trim()) {
      const search = filter.search.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(search));
    }

    if (filter.type) {
      const targetType = filter.type.toLowerCase();
      result = result.filter(p => p.types.includes(targetType));
    }

    // Sort
    const { sortField, sortOrder } = filter;
    result.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortField === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortField === 'id') {
        valA = a.id;
        valB = b.id;
      } else {
        valA = a.stats[sortField] ?? 0;
        valB = b.stats[sortField] ?? 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalCount = result.length;
    const startIndex = (filter.page - 1) * filter.pageSize;
    const pokemons = result.slice(startIndex, startIndex + filter.pageSize);

    return { pokemons, totalCount };
  }
}

