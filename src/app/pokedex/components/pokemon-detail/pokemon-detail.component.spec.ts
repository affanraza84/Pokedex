import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonDetailComponent } from './pokemon-detail.component';
import { Pokemon } from '../../models/pokemon.model';

describe('PokemonDetailComponent (Signals & Computed)', () => {
  let component: PokemonDetailComponent;
  let fixture: ComponentFixture<PokemonDetailComponent>;

  const samplePokemon: Pokemon = {
    id: 6,
    name: 'charizard',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    artwork: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    types: ['fire', 'flying'],
    stats: {
      hp: 78,
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100,
      total: 534
    },
    abilities: [
      { name: 'blaze', isHidden: false },
      { name: 'solar-power', isHidden: true }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonDetailComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonDetailComponent);
    component = fixture.componentInstance;
  });

  it('should initialize with default input signals and loading signal', () => {
    expect(component.isOpen()).toBe(false);
    expect(component.pokemon()).toBeNull();
    expect(component.calculatedTotal()).toBe(0);
    expect(component.formattedPokedexId()).toBe('#000');
    expect(component.isImageLoaded()).toBe(false);
  });

  it('should compute total base stats reactively when pokemon signal changes', () => {
    fixture.componentRef.setInput('pokemon', samplePokemon);
    fixture.detectChanges();

    // 78 + 84 + 78 + 109 + 85 + 100 = 534
    expect(component.calculatedTotal()).toBe(534);
    expect(component.formattedPokedexId()).toBe('#006');
  });

  it('should derive stat breakdown with correct percentage values', () => {
    fixture.componentRef.setInput('pokemon', samplePokemon);
    fixture.detectChanges();

    const breakdown = component.statBreakdown();
    expect(breakdown.length).toBe(6);

    const hpEntry = breakdown.find(b => b.key === 'hp');
    expect(hpEntry).toBeDefined();
    expect(hpEntry?.val).toBe(78);
    // (78 / 255) * 100 = 30.58 => 31%
    expect(hpEntry?.percent).toBe(31);

    const spAtkEntry = breakdown.find(b => b.key === 'specialAttack');
    expect(spAtkEntry?.val).toBe(109);
    // (109 / 255) * 100 = 42.74 => 43%
    expect(spAtkEntry?.percent).toBe(43);
  });

  it('should emit closed output signal when close button is clicked', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('pokemon', samplePokemon);
    fixture.detectChanges();

    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    const closeBtn = fixture.nativeElement.querySelector('.close-btn') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(closedEmitted).toBe(true);
  });
});

