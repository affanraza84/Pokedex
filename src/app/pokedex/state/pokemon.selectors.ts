import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { PokemonStore, PokemonState } from './pokemon.store';
import { Pokemon, SortField, SortOrder } from '../models/pokemon.model';

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export interface PokemonStatistics {
  averageHp: number;
  averageAttack: number;
  averageDefense: number;
  averageSpeed: number;
  highestStatPokemon: { name: string; stat: string; value: number } | null;
  totalPokemonCount: number;
}

/**
 * Reactive selectors for Pokédex state.
 * Uses combineLatest(), map(), distinctUntilChanged(), and shareReplay(1)
 * to provide highly-efficient derived multicasting streams.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);
  private readonly state$: Observable<PokemonState> = this.store.getState$();

  /**
   * Stream of Pokémon currently displayed on the active page.
   */
  public readonly pokemons$: Observable<Pokemon[]> = this.state$.pipe(
    map(s => s.pokemons),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of all Pokémon accumulated in memory across pages.
   */
  public readonly allPokemons$: Observable<Pokemon[]> = this.state$.pipe(
    map(s => s.allLoadedPokemons.length > 0 ? s.allLoadedPokemons : s.pokemons),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of loading indicator.
   */
  public readonly loading$: Observable<boolean> = this.state$.pipe(
    map(s => s.loading),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of error message, if any.
   */
  public readonly error$: Observable<string | null> = this.state$.pipe(
    map(s => s.error),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of total matching count across all pages.
   */
  public readonly totalCount$: Observable<number> = this.state$.pipe(
    map(s => s.totalCount),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of available Pokémon types.
   */
  public readonly availableTypes$: Observable<string[]> = this.state$.pipe(
    map(s => s.availableTypes),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of active search term.
   */
  public readonly searchTerm$: Observable<string> = this.state$.pipe(
    map(s => s.searchTerm),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of selected type filter.
   */
  public readonly selectedType$: Observable<string> = this.state$.pipe(
    map(s => s.selectedType),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of currently selected Pokémon ID for details panel.
   */
  public readonly selectedPokemonId$: Observable<number | null> = this.state$.pipe(
    map(s => s.selectedPokemonId),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of active sorting field and order.
   */
  public readonly sortInfo$: Observable<{ field: SortField; order: SortOrder }> = this.state$.pipe(
    map(s => ({ field: s.sortField, order: s.sortOrder })),
    distinctUntilChanged((a, b) => a.field === b.field && a.order === b.order),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream of pagination metadata.
   */
  public readonly pagination$: Observable<PaginationInfo> = this.state$.pipe(
    map(s => {
      const totalPages = Math.max(1, Math.ceil(s.totalCount / s.pageSize));
      const startIndex = s.totalCount === 0 ? 0 : (s.page - 1) * s.pageSize + 1;
      const endIndex = Math.min(s.page * s.pageSize, s.totalCount);
      return {
        currentPage: s.page,
        pageSize: s.pageSize,
        totalCount: s.totalCount,
        totalPages,
        startIndex,
        endIndex
      };
    }),
    distinctUntilChanged(
      (a, b) =>
        a.currentPage === b.currentPage &&
        a.pageSize === b.pageSize &&
        a.totalCount === b.totalCount
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Derived stream of filtered Pokémon using combineLatest().
   * Combines all loaded Pokémon with current search and type filters.
   */
  public readonly filteredPokemons$: Observable<Pokemon[]> = combineLatest([
    this.allPokemons$,
    this.searchTerm$,
    this.selectedType$
  ]).pipe(
    map(([pokemons, search, type]) => {
      let result = pokemons;
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(query));
      }
      if (type) {
        result = result.filter(p => p.types.includes(type.toLowerCase()));
      }
      return result;
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Derived stream of the currently selected Pokémon for detail panel using combineLatest().
   */
  public readonly selectedPokemon$: Observable<Pokemon | null> = combineLatest([
    this.allPokemons$,
    this.selectedPokemonId$
  ]).pipe(
    map(([pokemons, id]) => {
      if (id === null) return null;
      return pokemons.find(p => p.id === id) ?? null;
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Derived stream of Pokémon statistics across the currently viewed dataset.
   */
  public readonly pokemonStatistics$: Observable<PokemonStatistics> = this.pokemons$.pipe(
    map(pokemons => {
      if (pokemons.length === 0) {
        return {
          averageHp: 0,
          averageAttack: 0,
          averageDefense: 0,
          averageSpeed: 0,
          highestStatPokemon: null,
          totalPokemonCount: 0
        };
      }

      const count = pokemons.length;
      let totalHp = 0;
      let totalAtk = 0;
      let totalDef = 0;
      let totalSpd = 0;
      let highest = { name: '', stat: 'total', value: 0 };

      for (const p of pokemons) {
        totalHp += p.stats.hp;
        totalAtk += p.stats.attack;
        totalDef += p.stats.defense;
        totalSpd += p.stats.speed;
        if (p.stats.total > highest.value) {
          highest = { name: p.name, stat: 'total', value: p.stats.total };
        }
      }

      return {
        averageHp: Math.round(totalHp / count),
        averageAttack: Math.round(totalAtk / count),
        averageDefense: Math.round(totalDef / count),
        averageSpeed: Math.round(totalSpd / count),
        highestStatPokemon: highest.name ? highest : null,
        totalPokemonCount: count
      };
    }),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Stream indicating whether the fallback offline dataset is currently active.
   */
  public readonly isFallback$: Observable<boolean> = this.state$.pipe(
    map(s => s.isFallback),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Returns a derived stream for a specific Pokémon by its numeric ID.
   *
   * @param id Pokémon numeric ID.
   * @returns Observable emitting the matching Pokemon or undefined.
   */
  public selectPokemonById(id: number): Observable<Pokemon | undefined> {
    return this.allPokemons$.pipe(
      map(pokemons => pokemons.find(p => p.id === id)),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
