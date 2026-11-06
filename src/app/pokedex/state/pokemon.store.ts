import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subject, Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError
} from 'rxjs/operators';
import {
  Pokemon,
  PokemonFilter,
  PokemonListResponse,
  SortField,
  SortOrder
} from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { FALLBACK_POKEMONS } from '../../core/data/pokemon-fallback.data';

export interface PokemonState {
  pokemons: Pokemon[];
  allLoadedPokemons: Pokemon[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedType: string;
  sortField: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  selectedPokemonId: number | null;
  availableTypes: string[];
  isFallback: boolean;
}

const INITIAL_STATE: PokemonState = {
  pokemons: [],
  allLoadedPokemons: [],
  totalCount: 0,
  loading: false,
  error: null,
  searchTerm: '',
  selectedType: '',
  sortField: 'id',
  sortOrder: 'asc',
  page: 1,
  pageSize: 10,
  selectedPokemonId: null,
  availableTypes: [],
  isFallback: false
};

/**
 * Custom RxJS-based reactive store for Pokédex data.
 * Manages Pokémon state, caching, search debouncing, and pagination via BehaviorSubject.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonStore {
  private readonly apiService = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state$ = new BehaviorSubject<PokemonState>(INITIAL_STATE);

  // Search input stream for debounced pipeline
  private readonly searchInput$ = new Subject<string>();

  // In-memory query response cache to avoid duplicate API calls
  private readonly queryCache = new Map<string, PokemonListResponse>();

  constructor() {
    this.initSearchPipeline();
    this.loadAvailableTypes();
    this.fetchCurrentPage();
  }

  /**
   * Returns an Observable of the full Pokémon state.
   */
  public getState$(): Observable<PokemonState> {
    return this.state$.asObservable();
  }

  /**
   * Returns a snapshot of the current state.
   */
  public getSnapshot(): PokemonState {
    return this.state$.getValue();
  }

  /**
   * Updates the search term using a debounced, cancellable RxJS pipeline.
   *
   * @param term The user search query string.
   */
  public setSearchTerm(term: string): void {
    this.updateState({ searchTerm: term, page: 1 });
    this.searchInput$.next(term);
  }

  /**
   * Filters Pokémon by type.
   *
   * @param type The Pokémon type string, or empty string for all types.
   */
  public setSelectedType(type: string): void {
    this.updateState({ selectedType: type, page: 1 });
    this.fetchCurrentPage();
  }

  /**
   * Sorts the list by a given Pokémon attribute. Toggles ASC/DESC if field matches current sort.
   *
   * @param field The field to sort by.
   */
  public setSort(field: SortField): void {
    const current = this.getSnapshot();
    let order: SortOrder = 'asc';

    if (current.sortField === field) {
      order = current.sortOrder === 'asc' ? 'desc' : 'asc';
    }

    this.updateState({ sortField: field, sortOrder: order, page: 1 });
    this.fetchCurrentPage();
  }

  /**
   * Navigates to a specific page number.
   *
   * @param page Target page number (1-indexed).
   */
  public setPage(page: number): void {
    if (page < 1) return;
    this.updateState({ page });
    this.fetchCurrentPage();
  }

  /**
   * Sets the page size (e.g., 10, 25, 50).
   *
   * @param pageSize Number of items per page.
   */
  public setPageSize(pageSize: number): void {
    this.updateState({ pageSize, page: 1 });
    this.fetchCurrentPage();
  }

  /**
   * Selects a Pokémon by ID for display in the detail panel.
   *
   * @param pokemonId ID of the selected Pokémon, or null to close panel.
   */
  public selectPokemon(pokemonId: number | null): void {
    this.updateState({ selectedPokemonId: pokemonId });
  }

  /**
   * Clears the query cache and triggers a fresh network reload.
   */
  public reload(): void {
    this.queryCache.clear();
    this.fetchCurrentPage();
  }

  /**
   * Updates individual properties of the state immutably.
   */
  private updateState(partial: Partial<PokemonState>): void {
    this.state$.next({
      ...this.state$.getValue(),
      ...partial
    });
  }

  /**
   * Initializes the search pipeline with the exact sequence:
   * debounceTime(300) -> distinctUntilChanged() -> switchMap()
   * Cancels in-flight requests when a newer search arrives.
   */
  private initSearchPipeline(): void {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.executeFetch()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Triggers an immediate fetch for non-search actions (pagination, sort, type filter).
   */
  private fetchCurrentPage(): void {
    this.executeFetch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Executes the fetch operation with caching to avoid duplicate requests.
   */
  private executeFetch(): Observable<PokemonListResponse> {
    const s = this.getSnapshot();
    const cacheKey = `${s.searchTerm}:${s.selectedType}:${s.sortField}:${s.sortOrder}:${s.page}:${s.pageSize}`;

    // Return cached result immediately if available
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      this.updateState({
        pokemons: cached.pokemons,
        totalCount: cached.totalCount,
        loading: false,
        error: null
      });
      return of(cached);
    }

    this.updateState({ loading: true, error: null });

    const filter: PokemonFilter = {
      search: s.searchTerm,
      type: s.selectedType,
      page: s.page,
      pageSize: s.pageSize,
      sortField: s.sortField,
      sortOrder: s.sortOrder
    };

    return this.apiService.getPokemons(filter).pipe(
      tap(result => {
        // Cache this query response
        this.queryCache.set(cacheKey, result);
        this.cacheLoadedPokemons(result.pokemons);

        this.updateState({
          pokemons: result.pokemons,
          totalCount: result.totalCount,
          loading: false,
          error: null,
          isFallback: false
        });
      }),
      catchError(err => {
        console.warn('[PokemonStore] PokéAPI query failed, falling back to local dataset:', err);
        const fallbackResult = this.filterFallbackDataset(filter);
        this.cacheLoadedPokemons(fallbackResult.pokemons);

        this.updateState({
          pokemons: fallbackResult.pokemons,
          totalCount: fallbackResult.totalCount,
          loading: false,
          error: err instanceof Error ? err.message : 'PokéAPI request failed',
          isFallback: true
        });

        return of(fallbackResult);
      })
    );
  }

  /**
   * Accumulates distinct Pokémon in memory across pages for instant autocomplete lookup.
   */
  private cacheLoadedPokemons(newPokemons: Pokemon[]): void {
    const current = this.getSnapshot().allLoadedPokemons;
    const existingIds = new Set(current.map(p => p.id));
    const toAdd = newPokemons.filter(p => !existingIds.has(p.id));

    if (toAdd.length > 0) {
      this.updateState({
        allLoadedPokemons: [...current, ...toAdd]
      });
    }
  }

  /**
   * Loads the list of available Pokémon types.
   */
  private loadAvailableTypes(): void {
    this.apiService
      .getTypes()
      .pipe(
        tap(types => this.updateState({ availableTypes: types })),
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * In-memory client-side filter and sorting for fallback data.
   */
  private filterFallbackDataset(filter: PokemonFilter): PokemonListResponse {
    let result = [...FALLBACK_POKEMONS];

    if (filter.search && filter.search.trim()) {
      const search = filter.search.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(search));
    }

    if (filter.type) {
      const targetType = filter.type.toLowerCase();
      result = result.filter(p => p.types.includes(targetType));
    }

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
