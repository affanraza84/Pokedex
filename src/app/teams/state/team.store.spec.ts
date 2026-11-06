import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom, Subject } from 'rxjs';
import { TeamStore } from './team.store';
import { TeamApiService } from '../services/team-api.service';
import { Team, TeamInput } from '../models/team.model';

describe('TeamStore (Optimistic Creation & Rollback)', () => {
  let store: TeamStore;
  let mockApiService: {
    getTeams: any;
    createTeam: any;
    deleteTeam: any;
  };

  const initialTeams: Team[] = [
    {
      id: '1',
      name: 'Existing Alpha',
      pokemons: []
    }
  ];

  beforeEach(() => {
    mockApiService = {
      getTeams: () => of([...initialTeams]),
      createTeam: (input: TeamInput) =>
        of({ id: 'server-999', name: input.name, pokemons: input.pokemons }),
      deleteTeam: (id: string) => of(true)
    };

    TestBed.configureTestingModule({
      providers: [
        TeamStore,
        { provide: TeamApiService, useValue: mockApiService }
      ]
    });

    store = TestBed.inject(TeamStore);
  });

  it('should load initial teams from server into BehaviorSubject', async () => {
    const teams = await firstValueFrom(store.teams$);
    expect(teams.length).toBe(1);
    expect(teams[0].name).toBe('Existing Alpha');
  });

  it('should immediately update the UI with optimistic team before server responds', () => {
    // Keep server response in flight via uncompleted Subject
    const pendingSubject = new Subject<Team>();
    mockApiService.createTeam = () => pendingSubject.asObservable();

    store.createTeam({
      name: 'Optimistic Team',
      pokemons: []
    });

    // Right after createTeam invocation while server is still responding:
    const teams = store['state$'].getValue().teams;
    expect(teams.length).toBe(2);
    expect(teams[0].name).toBe('Optimistic Team');
    expect(teams[0].id.startsWith('optimistic-')).toBe(true);
    expect(teams[0].isOptimistic).toBe(true);
  });

  it('should replace optimistic team with server-confirmed team upon success', async () => {
    mockApiService.createTeam = (input: TeamInput) =>
      of({ id: 'server-real-777', name: input.name, pokemons: input.pokemons });

    store.createTeam({
      name: 'Champions',
      pokemons: []
    });

    const teams = await firstValueFrom(store.teams$);
    expect(teams.length).toBe(2);
    expect(teams[0].id).toBe('server-real-777');
    expect(teams[0].name).toBe('Champions');
    expect(teams[0].isOptimistic).toBe(false);
  });

  it('should rollback optimistic update and expose error to UI when server mutation fails', async () => {
    mockApiService.createTeam = () =>
      throwError(() => new Error('GraphQL 503 Service Unavailable'));

    store.createTeam({
      name: 'Doomed Squad',
      pokemons: []
    });

    const teams = await firstValueFrom(store.teams$);
    // Rolled back to original single team
    expect(teams.length).toBe(1);
    expect(teams[0].name).toBe('Existing Alpha');

    // Error exposed to UI
    const error = await firstValueFrom(store.error$);
    expect(error).toContain('Optimistic change rolled back');
    expect(error).toContain('GraphQL 503 Service Unavailable');
  });

  it('should optimistically delete team and rollback if server fails', async () => {
    mockApiService.deleteTeam = () =>
      throwError(() => new Error('GraphQL Delete Constraint Error'));

    store.deleteTeam('1');

    const teams = await firstValueFrom(store.teams$);
    // Restored back after failure
    expect(teams.length).toBe(1);
    expect(teams[0].id).toBe('1');

    const error = await firstValueFrom(store.error$);
    expect(error).toContain('Failed to delete team on server');
  });

  it('should accurately check if a team name is already taken', () => {
    expect(store.isNameTaken('Existing Alpha')).toBe(true);
    expect(store.isNameTaken('EXISTING ALPHA')).toBe(true);
    expect(store.isNameTaken('New Brand Name')).toBe(false);
  });
});
