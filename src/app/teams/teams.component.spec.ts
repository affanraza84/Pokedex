import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TeamsComponent } from './teams.component';
import { TeamStore } from './state/team.store';
import { PokemonSelectors } from '../pokedex/state/pokemon.selectors';
import { Team, TeamMember } from './models/team.model';

describe('TeamsComponent (Angular Signals & Computed & Effects)', () => {
  let component: TeamsComponent;
  let fixture: ComponentFixture<TeamsComponent>;
  let mockTeamStore: any;
  let mockPokemonSelectors: any;

  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => storageMap.set(key, value),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear()
  };

  const mockTeam: Team = {
    id: 'team-42',
    name: 'Kanto Squad',
    pokemons: [
      {
        id: 1,
        name: 'bulbasaur',
        sprite: '',
        types: ['grass', 'poison'],
        stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 }
      },
      {
        id: 4,
        name: 'charmander',
        sprite: '',
        types: ['fire'],
        stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 }
      }
    ]
  };

  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
  });

  beforeEach(async () => {
    storageMap.clear();

    mockTeamStore = {
      teams$: of([mockTeam]),
      loading$: of(false),
      saving$: of(false),
      error$: of(null),
      notification$: of(null),
      loadTeams: () => {},
      createTeam: () => {},
      deleteTeam: () => {},
      clearNotification: () => {}
    };

    mockPokemonSelectors = {
      pokemons$: of([])
    };

    await TestBed.configureTestingModule({
      imports: [TeamsComponent],
      providers: [
        { provide: TeamStore, useValue: mockTeamStore },
        { provide: PokemonSelectors, useValue: mockPokemonSelectors }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    storageMap.clear();
  });

  it('should bridge RxJS team store into Angular Signals via toSignal()', () => {
    expect(component.teams().length).toBe(1);
    expect(component.teams()[0].name).toBe('Kanto Squad');
    expect(component.loading()).toBe(false);
  });

  it('should compute team total base stats and average per member', () => {
    // Select the mock team
    component.selectedTeam.set(mockTeam);
    fixture.detectChanges();

    // 318 + 309 = 627
    expect(component.teamTotalBaseStats()).toBe(627);
    // 627 / 2 = 313.5 => 314
    expect(component.teamAverageBaseStats()).toBe(314);
    expect(component.isTeamComplete()).toBe(false);
  });

  it('should compute team type distribution and percentages reactively', () => {
    component.selectedTeam.set(mockTeam);
    fixture.detectChanges();

    // Types in mock team: grass (1), poison (1), fire (1) = total 3 occurrences
    // Each is 1/3 ~ 33%
    const distribution = component.teamTypeDistribution();
    expect(distribution.length).toBe(3);

    const types = distribution.map(d => d.type);
    expect(types).toContain('grass');
    expect(types).toContain('poison');
    expect(types).toContain('fire');
    expect(distribution[0].percentage).toBe(33);
  });

  it('should persist selected team in localStorage using effect()', async () => {
    // Setting selectedTeam signal triggers the effect()
    component.selectedTeam.set(mockTeam);
    fixture.detectChanges();

    // Small delay for effect execution
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(localStorage.getItem('pokedex_selected_team_id')).toBe('team-42');

    // Clearing selectedTeam removes from localStorage
    component.selectedTeam.set(null);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(localStorage.getItem('pokedex_selected_team_id')).toBeNull();
  });

  it('should switch between draft members and saved team in computed signals', () => {
    const draft: TeamMember[] = [
      {
        id: 25,
        name: 'pikachu',
        sprite: '',
        types: ['electric'],
        stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 }
      }
    ];

    // Draft mode (selectedTeam is null)
    component.draftMembers.set(draft);
    component.selectedTeam.set(null);
    fixture.detectChanges();

    expect(component.teamTotalBaseStats()).toBe(320);
    expect(component.teamAverageBaseStats()).toBe(320);

    const types = component.teamTypeDistribution();
    expect(types.length).toBe(1);
    expect(types[0].type).toBe('electric');
    expect(types[0].percentage).toBe(100);
  });
});
