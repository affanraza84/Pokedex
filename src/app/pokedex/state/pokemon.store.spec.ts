import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PokemonStore } from './pokemon.store';
import { PokemonApiService } from '../services/pokemon-api.service';
import { PokemonListResponse } from '../models/pokemon.model';

describe('PokemonStore (RxJS Custom State Management)', () => {
  let store: PokemonStore;
  let mockApiService: {
    getPokemons: any;
    getTypes: any;
  };

  const mockResponse: PokemonListResponse = {
    totalCount: 1,
    pokemons: [
      {
        id: 1,
        name: 'bulbasaur',
        sprite: '',
        artwork: '',
        types: ['grass', 'poison'],
        stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
        abilities: [{ name: 'overgrow', isHidden: false }]
      }
    ]
  };

  beforeEach(() => {
    mockApiService = {
      getPokemons: () => of(mockResponse),
      getTypes: () => of(['grass', 'fire', 'water'])
    };

    TestBed.configureTestingModule({
      providers: [
        PokemonStore,
        { provide: PokemonApiService, useValue: mockApiService }
      ]
    });

    store = TestBed.inject(PokemonStore);
  });

  it('should initialize and load Pokémon list into BehaviorSubject', async () => {
    const state = store.getSnapshot();
    expect(state.pokemons.length).toBe(1);
    expect(state.pokemons[0].name).toBe('bulbasaur');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should debounce search input (300ms) before triggering API query', async () => {
    let callCount = 0;
    mockApiService.getPokemons = () => {
      callCount++;
      return of(mockResponse);
    };

    // First keystroke
    store.setSearchTerm('ch');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callCount).toBe(0);

    // Second keystroke within debounce window (should cancel/reset timer)
    store.setSearchTerm('char');
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(callCount).toBe(0);

    // Wait until full 300ms debounce expires (+ small buffer)
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(callCount).toBe(1);
    expect(store.getSnapshot().searchTerm).toBe('char');
  });

  it('should avoid duplicate API calls by serving from memory cache', () => {
    let apiCalls = 0;
    mockApiService.getPokemons = () => {
      apiCalls++;
      return of(mockResponse);
    };

    // First fetch for page 2
    store.setPage(2);
    expect(apiCalls).toBe(1);

    // Go to page 1
    store.setPage(1);

    // Return to page 2 (should be cached!)
    store.setPage(2);
    expect(apiCalls).toBe(1); // Cached! No additional API call made
  });

  it('should smoothly activate fallback dataset when PokéAPI returns error', async () => {
    mockApiService.getPokemons = () => throwError(() => new Error('PokéAPI rate limit'));

    store.reload();

    const snapshot = store.getSnapshot();
    expect(snapshot.isFallback).toBe(true);
    expect(snapshot.pokemons.length).toBeGreaterThan(0);
    expect(snapshot.loading).toBe(false);
  });

  it('should update pagination, sort, and detail selection states', () => {
    store.setPageSize(25);
    expect(store.getSnapshot().pageSize).toBe(25);

    store.setSort('speed');
    expect(store.getSnapshot().sortField).toBe('speed');
    expect(store.getSnapshot().sortOrder).toBe('asc');

    store.setSort('speed');
    expect(store.getSnapshot().sortOrder).toBe('desc');

    store.selectPokemon(25);
    expect(store.getSnapshot().selectedPokemonId).toBe(25);
  });

  it('should filter and sort Pokémon accurately in fallback offline mode', () => {
    // Trigger fallback mode
    mockApiService.getPokemons = () => throwError(() => new Error('Offline'));
    store.reload();
    expect(store.getSnapshot().isFallback).toBe(true);

    // Filter by type 'fire'
    store.setSelectedType('fire');
    const firePokemons = store.getSnapshot().pokemons;
    expect(firePokemons.length).toBeGreaterThan(0);
    expect(firePokemons.every(p => p.types.includes('fire'))).toBe(true);

    // Sort by attack descending
    store.setSort('attack');
    // First setSort sets asc
    store.setSort('attack');
    // Second setSort toggles to desc
    expect(store.getSnapshot().sortOrder).toBe('desc');
    const sorted = store.getSnapshot().pokemons;
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].stats.attack).toBeGreaterThanOrEqual(sorted[i + 1].stats.attack);
    }
  });
});
