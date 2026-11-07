import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonAutocompleteComponent } from './pokemon-autocomplete.component';
import { Pokemon } from '../../../pokedex/models/pokemon.model';

describe('PokemonAutocompleteComponent (Debounced Search & Suggestions)', () => {
  let component: PokemonAutocompleteComponent;
  let fixture: ComponentFixture<PokemonAutocompleteComponent>;

  const mockPokemons: Pokemon[] = [
    {
      id: 1,
      name: 'bulbasaur',
      sprite: '',
      artwork: '',
      types: ['grass', 'poison'],
      stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
      abilities: []
    },
    {
      id: 4,
      name: 'charmander',
      sprite: '',
      artwork: '',
      types: ['fire'],
      stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 },
      abilities: []
    },
    {
      id: 25,
      name: 'pikachu',
      sprite: '',
      artwork: '',
      types: ['electric'],
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
      abilities: []
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonAutocompleteComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('availablePokemons', mockPokemons);
    fixture.detectChanges();
  });

  it('should debounce search input (300ms) before updating filtered suggestions', async () => {
    component.onQueryInput('char');
    // Before 300ms
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(component.debouncedQuery()).toBe('');

    // After 300ms window (+ buffer)
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(component.debouncedQuery()).toBe('char');

    const filtered = component.filteredPokemons();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('charmander');
  });

  it('should mark already added Pokémon as disabled and indicate "In Team"', () => {
    fixture.componentRef.setInput('selectedMemberIds', [4]); // charmander is in team
    fixture.detectChanges();

    expect(component.isAlreadyInTeam(4)).toBe(true);
    expect(component.isAlreadyInTeam(25)).toBe(false);

    let emitted: any = null;
    component.selectPokemon.subscribe(p => {
      emitted = p;
    });

    // Attempting to select Charmander (id: 4) should be ignored
    component.onSelect(mockPokemons[1]);
    expect(emitted).toBeNull();

    // Selecting Pikachu (id: 25) succeeds
    component.onSelect(mockPokemons[2]);
    expect(emitted?.name).toBe('pikachu');
  });

  it('should clear query and close dropdown when clearQuery is called', () => {
    component.inputVal.set('test');
    component.debouncedQuery.set('test');
    component.isOpen.set(true);

    component.clearQuery();
    expect(component.inputVal()).toBe('');
    expect(component.debouncedQuery()).toBe('');
    expect(component.isOpen()).toBe(false);
  });
});
