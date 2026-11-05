import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  tap,
  catchError
} from 'rxjs/operators';
import { Pokemon, PokemonFilter, SortField, SortOrder } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';

export interface PokemonState {
  pokemons: Pokemon[];
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
 * Manages Pokémon list state, filters, sorting, and pagination via BehaviorSubject.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonStore {
  private readonly apiService = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state$ = new BehaviorSubject<PokemonState>(INITIAL_STATE);
  private readonly searchTrigger$ = new Subject<string>();

  constructor() {
    this.initSearchPipeline();
    this.loadTypes();
    this.fetchPokemons();
  }

  /**
   * Returns an observable of the full state.
   */
  public getState$() {
    return this.state$.asObservable();
  }

  /**
   * Returns current snapshot of the state.
   */
  public getSnapshot(): PokemonState {
    return this.state$.getValue();
  }

  /**
   * Updates the search term using debounced pipeline.
   *
   * @param term The query string entered by user.
   */
  public setSearchTerm(term: string): void {
    this.updateState({ searchTerm: term, page: 1 });
    this.searchTrigger$.next(term);
  }

  /**
   * Filters Pokémon by type.
   *
   * @param type Pokémon type (e.g., 'fire', 'water') or empty string for all.
   */
  public setSelectedType(type: string): void {
    this.updateState({ selectedType: type, page: 1 });
    this.fetchPokemons();
  }

  /**
   * Sorts Pokémon by a stat or identifier.
   *
   * @param field The property to sort by (e.g., 'hp', 'attack', 'name').
   */
  public setSort(field: SortField): void {
    const current = this.getSnapshot();
    let order: SortOrder = 'asc';

    if (current.sortField === field) {
      order = current.sortOrder === 'asc' ? 'desc' : 'asc';
    }

    this.updateState({ sortField: field, sortOrder: order, page: 1 });
    this.fetchPokemons();
  }

  /**
   * Sets current page index.
   *
   * @param page Target page number (1-indexed).
   */
  public setPage(page: number): void {
    if (page < 1) return;
    this.updateState({ page });
    this.fetchPokemons();
  }

  /**
   * Sets the number of items per page.
   *
   * @param pageSize Page size (10, 25, or 50).
   */
  public setPageSize(pageSize: number): void {
    this.updateState({ pageSize, page: 1 });
    this.fetchPokemons();
  }

  /**
   * Selects a Pokémon to view in the slide-in detail panel.
   *
   * @param pokemonId ID of the selected Pokémon, or null to close panel.
   */
  public selectPokemon(pokemonId: number | null): void {
    this.updateState({ selectedPokemonId: pokemonId });
  }

  /**
   * Triggers a manual reload of the Pokémon list.
   */
  public reload(): void {
    this.fetchPokemons();
  }

  /**
   * Internal helper to update state immutably.
   */
  private updateState(partial: Partial<PokemonState>): void {
    this.state$.next({
      ...this.state$.getValue(),
      ...partial
    });
  }

  /**
   * Initializes the debounced search stream pipeline.
   * Uses debounceTime(300), distinctUntilChanged(), and switchMap().
   */
  private initSearchPipeline(): void {
    this.searchTrigger$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.fetchPokemons()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Loads the list of available Pokémon types.
   */
  private loadTypes(): void {
    this.apiService
      .getTypes()
      .pipe(
        tap(types => this.updateState({ availableTypes: types })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Fetches Pokémon based on current state parameters.
   */
  private fetchPokemons(): void {
    const s = this.getSnapshot();
    const filter: PokemonFilter = {
      search: s.searchTerm,
      type: s.selectedType,
      page: s.page,
      pageSize: s.pageSize,
      sortField: s.sortField,
      sortOrder: s.sortOrder
    };

    this.updateState({ loading: true, error: null });

    this.apiService
      .getPokemons(filter)
      .pipe(
        tap(result => {
          this.updateState({
            pokemons: result.response.pokemons,
            totalCount: result.response.totalCount,
            isFallback: result.fromFallback,
            loading: false,
            error: null
          });
        }),
        catchError(err => {
          this.updateState({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load Pokémon data'
          });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
