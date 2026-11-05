import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { PokemonStore, PokemonState } from './pokemon.store';
import { Pokemon, SortField, SortOrder } from '../../../core/models/pokemon.model';

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Reactive selectors for Pokédex state.
 * All derived streams use shareReplay(1) for efficient multicasting without re-computation.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);
  private readonly state$: Observable<PokemonState> = this.store.getState$();

  /**
   * Stream of Pokémon currently displayed in the table.
   */
  public readonly pokemons$: Observable<Pokemon[]> = this.state$.pipe(
    map(s => s.pokemons),
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
   * Stream of total matching count.
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
   * Stream of active sort settings.
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
   * Stream of the currently selected Pokémon for detail panel.
   */
  public readonly selectedPokemon$: Observable<Pokemon | null> = this.state$.pipe(
    map(s => {
      if (s.selectedPokemonId === null) return null;
      return s.pokemons.find(p => p.id === s.selectedPokemonId) ?? null;
    }),
    distinctUntilChanged(),
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
}

