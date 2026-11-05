import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PokemonStore } from './pokemon.store';
import { PokemonSelectors } from './pokemon.selectors';

describe('PokemonStore and Selectors', () => {
  let store: PokemonStore;
  let selectors: PokemonSelectors;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        PokemonStore,
        PokemonSelectors
      ]
    });

    store = TestBed.inject(PokemonStore);
    selectors = TestBed.inject(PokemonSelectors);
  });

  it('should initialize with default state and load Pokémon list', async () => {
    const pokemons = await firstValueFrom(selectors.pokemons$);
    expect(pokemons).toBeDefined();
    expect(Array.isArray(pokemons)).toBe(true);
  });

  it('should update pagination and page size', () => {
    store.setPageSize(25);
    expect(store.getSnapshot().pageSize).toBe(25);
    expect(store.getSnapshot().page).toBe(1);

    store.setPage(2);
    expect(store.getSnapshot().page).toBe(2);
  });

  it('should update sort field and toggle order', () => {
    store.setSort('attack');
    expect(store.getSnapshot().sortField).toBe('attack');
    expect(store.getSnapshot().sortOrder).toBe('asc');

    store.setSort('attack');
    expect(store.getSnapshot().sortField).toBe('attack');
    expect(store.getSnapshot().sortOrder).toBe('desc');
  });

  it('should select and clear selected Pokémon for detail panel', () => {
    store.selectPokemon(25);
    expect(store.getSnapshot().selectedPokemonId).toBe(25);

    store.selectPokemon(null);
    expect(store.getSnapshot().selectedPokemonId).toBeNull();
  });
});

