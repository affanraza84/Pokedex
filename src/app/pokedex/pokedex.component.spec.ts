import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PokedexComponent } from './pokedex.component';
import { PokemonStore } from './state/pokemon.store';
import { PokemonSelectors } from './state/pokemon.selectors';
import { Pokemon } from './models/pokemon.model';

describe('PokedexComponent (Dashboard View Integration)', () => {
  let component: PokedexComponent;
  let fixture: ComponentFixture<PokedexComponent>;
  let mockStore: any;
  let mockSelectors: any;

  const mockPokemon: Pokemon = {
    id: 1,
    name: 'bulbasaur',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    types: ['grass', 'poison'],
    stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
    abilities: [{ name: 'overgrow', isHidden: false }]
  };

  beforeEach(async () => {
    mockStore = {
      setSearchTerm: vi.fn(),
      setSelectedType: vi.fn(),
      setSort: vi.fn(),
      setPage: vi.fn(),
      setPageSize: vi.fn(),
      selectPokemon: vi.fn(),
      reload: vi.fn()
    };

    mockSelectors = {
      pokemons$: of([mockPokemon]),
      loading$: of(false),
      error$: of(null),
      searchTerm$: of(''),
      selectedType$: of(''),
      availableTypes$: of(['grass', 'poison', 'fire']),
      sortInfo$: of({ field: 'id', order: 'asc' }),
      pagination$: of({
        currentPage: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        startIndex: 1,
        endIndex: 1
      }),
      selectedPokemon$: of(null)
    };

    await TestBed.configureTestingModule({
      imports: [PokedexComponent],
      providers: [
        { provide: PokemonStore, useValue: mockStore },
        { provide: PokemonSelectors, useValue: mockSelectors }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PokedexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and display Pokémon in table', () => {
    expect(component.pokemons().length).toBe(1);
    expect(component.pokemons()[0].name).toBe('bulbasaur');
    expect(component.isDetailOpen()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pokemon-table')).toBeTruthy();
    expect(compiled.textContent).toContain('Bulbasaur');
  });

  it('should open slide-in detail panel when a pokemon is selected', () => {
    component.onSelectPokemon(1);
    fixture.detectChanges();

    expect(component.isDetailOpen()).toBe(true);
    expect(component.selectedPokemon()?.name).toBe('bulbasaur');
    expect(mockStore.selectPokemon).toHaveBeenCalledWith(1);

    const drawer = fixture.nativeElement.querySelector('.drawer-panel');
    expect(drawer).toBeTruthy();
  });

  it('should close detail panel when onCloseDetail is called', () => {
    component.onSelectPokemon(1);
    fixture.detectChanges();
    expect(component.isDetailOpen()).toBe(true);

    component.onCloseDetail();
    fixture.detectChanges();

    expect(component.isDetailOpen()).toBe(false);
    expect(component.selectedPokemon()).toBeNull();
    expect(mockStore.selectPokemon).toHaveBeenCalledWith(null);
  });

  it('should delegate search, type filter, sorting, and pagination to PokemonStore', () => {
    component.onSearchChange('pikachu');
    expect(mockStore.setSearchTerm).toHaveBeenCalledWith('pikachu');

    component.onTypeChange('electric');
    expect(mockStore.setSelectedType).toHaveBeenCalledWith('electric');

    component.onSort('speed');
    expect(mockStore.setSort).toHaveBeenCalledWith('speed');

    component.onPageChange(2);
    expect(mockStore.setPage).toHaveBeenCalledWith(2);

    component.onPageSizeChange(25);
    expect(mockStore.setPageSize).toHaveBeenCalledWith(25);

    component.onResetFilters();
    expect(mockStore.setSearchTerm).toHaveBeenCalledWith('');
    expect(mockStore.setSelectedType).toHaveBeenCalledWith('');
  });

  it('should trigger store.reload when retry button in error state is clicked', async () => {
    mockSelectors.error$ = of('PokéAPI Network Error');
    mockSelectors.pokemons$ = of([]);

    const errorFixture = TestBed.createComponent(PokedexComponent);
    errorFixture.detectChanges();

    const compiled = errorFixture.nativeElement as HTMLElement;
    const errorBanner = compiled.querySelector('.error-banner');
    expect(errorBanner).toBeTruthy();
    expect(errorBanner?.textContent).toContain('PokéAPI Network Error');

    const retryBtn = compiled.querySelector('.retry-btn') as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();
    retryBtn.click();

    expect(mockStore.reload).toHaveBeenCalled();
  });
});

