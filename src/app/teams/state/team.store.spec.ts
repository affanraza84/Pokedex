import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { TeamStore } from './team.store';
import { TeamApiService } from '../services/team-api.service';
import { Team, TeamInput } from '../models/team.model';

describe('TeamStore (Optimistic Updates & Rollback)', () => {
  let store: TeamStore;
  let mockApiService: Partial<TeamApiService> & Record<string, any>;

  const mockExistingTeams: Team[] = [
    {
      id: '1',
      name: 'Existing Alpha',
      pokemons: []
    }
  ];

  beforeEach(() => {
    mockApiService = {
      getTeams: () => of([...mockExistingTeams]),
      createTeam: (input: TeamInput) =>
        of({ id: 'server-999', name: input.name, pokemons: input.pokemons }),
      deleteTeam: (id: string) => of(true)
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        TeamStore,
        { provide: TeamApiService, useValue: mockApiService }
      ]
    });

    store = TestBed.inject(TeamStore);
  });

  it('should load initial teams into state', async () => {
    const teams = await firstValueFrom(store.teams$);
    expect(teams.length).toBe(1);
    expect(teams[0].name).toBe('Existing Alpha');
  });

  it('should detect duplicate team names with isNameTaken', () => {
    expect(store.isNameTaken('Existing Alpha')).toBe(true);
    expect(store.isNameTaken('existing alpha')).toBe(true);
    expect(store.isNameTaken('Brand New Team')).toBe(false);
  });

  it('should create a team optimistically and confirm with server ID', async () => {
    const input: TeamInput = {
      name: 'Delta Squad',
      pokemons: [
        {
          id: 1,
          name: 'bulbasaur',
          sprite: '',
          types: ['grass'],
          stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 }
        }
      ]
    };

    store.createTeam(input);

    const teams = await firstValueFrom(store.teams$);
    expect(teams.length).toBe(2);
    expect(teams[0].name).toBe('Delta Squad');
    expect(teams[0].id).toBe('server-999');
    expect(teams[0].isOptimistic).toBe(false);
  });

  it('should rollback state if server mutation fails during team creation', async () => {
    mockApiService.createTeam = () => throwError(() => new Error('GraphQL 500 Network Timeout'));

    const input: TeamInput = {
      name: 'Doomed Squad',
      pokemons: []
    };

    store.createTeam(input);

    const teams = await firstValueFrom(store.teams$);
    expect(teams.length).toBe(1);
    expect(teams[0].name).toBe('Existing Alpha');

    const err = await firstValueFrom(store.error$);
    expect(err).toContain('Optimistic change rolled back');
  });
});

