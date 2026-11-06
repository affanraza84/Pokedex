import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { PokemonSelectors } from './pokemon.selectors';
import { PokemonStore, PokemonState } from './pokemon.store';
import { Pokemon } from '../models/pokemon.model';

describe('PokemonSelectors (Derived Observable Streams)', () => {
  let selectors: PokemonSelectors;
  let state$: BehaviorSubject<PokemonState>;
  let mockStore: {
    getState$: any;
    getSnapshot: any;
  };

  const samplePokemons: Pokemon[] = [
    {
      id: 1,
      name: 'bulbasaur',
      sprite: '',
      artwork: '',
      types: ['grass', 'poison'],
      stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
      abilities: [{ name: 'overgrow', isHidden: false }]
    },
    {
      id: 4,
      name: 'charmander',
      sprite: '',
      artwork: '',
      types: ['fire'],
      stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 },
      abilities: [{ name: 'blaze', isHidden: false }]
    },
    {
      id: 25,
      name: 'pikachu',
      sprite: '',
      artwork: '',
      types: ['electric'],
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
      abilities: [{ name: 'static', isHidden: false }]
    }
  ];

  const mockState: PokemonState = {
    pokemons: samplePokemons,
    allLoadedPokemons: samplePokemons,
    totalCount: 3,
    loading: false,
    error: null,
    searchTerm: '',
    selectedType: '',
    sortField: 'id',
    sortOrder: 'asc',
    page: 1,
    pageSize: 10,
    selectedPokemonId: 25,
    availableTypes: ['grass', 'fire', 'electric'],
    isFallback: false
  };

  beforeEach(() => {
    state$ = new BehaviorSubject<PokemonState>(mockState);
    mockStore = {
      getState$: () => state$.asObservable(),
      getSnapshot: () => state$.getValue()
    };

    TestBed.configureTestingModule({
      providers: [
        PokemonSelectors,
        { provide: PokemonStore, useValue: mockStore }
      ]
    });

    selectors = TestBed.inject(PokemonSelectors);
  });

  it('should select currently displayed pokemons', async () => {
    const list = await firstValueFrom(selectors.pokemons$);
    expect(list.length).toBe(3);
    expect(list[0].name).toBe('bulbasaur');
  });

  it('should filter pokemons using combineLatest with search and type', async () => {
    // When searchTerm is 'char', emit new state into the store BehaviorSubject
    state$.next({ ...mockState, searchTerm: 'char' });

    const filtered = await firstValueFrom(selectors.filteredPokemons$);
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('charmander');
  });

  it('should select single Pokémon by ID', async () => {
    const pokemon = await firstValueFrom(selectors.selectPokemonById(4));
    expect(pokemon).toBeDefined();
    expect(pokemon?.name).toBe('charmander');
  });

  it('should select active detail Pokémon via selectedPokemon$', async () => {
    const selected = await firstValueFrom(selectors.selectedPokemon$);
    expect(selected).toBeDefined();
    expect(selected?.id).toBe(25);
    expect(selected?.name).toBe('pikachu');
  });

  it('should compute aggregate statistics across Pokémon', async () => {
    const stats = await firstValueFrom(selectors.pokemonStatistics$);
    expect(stats.totalPokemonCount).toBe(3);
    // (45 + 39 + 35) / 3 = 39.66 => 40
    expect(stats.averageHp).toBe(40);
    // (49 + 52 + 55) / 3 = 52
    expect(stats.averageAttack).toBe(52);
    // (45 + 65 + 90) / 3 = 66.66 => 67
    expect(stats.averageSpeed).toBe(67);
    // Highest total is Pikachu (320)
    expect(stats.highestStatPokemon?.name).toBe('pikachu');
    expect(stats.highestStatPokemon?.value).toBe(320);
  });
});
