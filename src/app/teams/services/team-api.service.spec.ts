import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import { TeamApiService } from './team-api.service';
import { GraphQLService } from '../../core/services/graphql.service';
import { GraphQLError } from '../../core/models/graphql.model';
import { TeamInput } from '../models/team.model';

describe('TeamApiService (Local GraphQL Operations)', () => {
  let service: TeamApiService;
  let mockGraphQLService: { execute: any };

  const mockTeamNode = {
    id: '1',
    name: 'Kanto Classics',
    trainer_id: '1',
    pokemons: JSON.stringify([
      {
        id: 25,
        name: 'pikachu',
        sprite: 'https://img/25.png',
        types: ['electric'],
        stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 }
      }
    ]),
    Trainer: { id: '1', name: 'Ash Ketchum' }
  };

  beforeEach(() => {
    mockGraphQLService = {
      execute: () => of({})
    };

    TestBed.configureTestingModule({
      providers: [
        TeamApiService,
        { provide: GraphQLService, useValue: mockGraphQLService }
      ]
    });

    service = TestBed.inject(TeamApiService);
  });

  it('should fetch and deserialize teams from the local GraphQL server', async () => {
    mockGraphQLService.execute = () => of({ allTeams: [mockTeamNode] });

    const teams = await firstValueFrom(service.getTeams());
    expect(teams.length).toBe(1);
    const team = teams[0];
    expect(team.id).toBe('1');
    expect(team.name).toBe('Kanto Classics');
    expect(team.trainer_id).toBe('1');
    expect(team.trainer?.name).toBe('Ash Ketchum');
    expect(team.pokemons.length).toBe(1);
    expect(team.pokemons[0].name).toBe('pikachu');
  });

  it('should execute createTeam mutation with schema-matching variables', async () => {
    mockGraphQLService.execute = (endpoint: string, query: string, variables: any) => {
      expect(variables.name).toBe('Aqua Squad');
      expect(variables.trainer_id).toBe('2');
      expect(typeof variables.pokemons).toBe('string');
      return of({
        createTeam: {
          id: '10',
          name: variables.name,
          trainer_id: variables.trainer_id,
          pokemons: variables.pokemons,
          Trainer: { id: '2', name: 'Misty' }
        }
      });
    };

    const input: TeamInput = {
      name: 'Aqua Squad',
      trainer_id: '2',
      pokemons: [
        {
          id: 120,
          name: 'staryu',
          sprite: '',
          types: ['water'],
          stats: { hp: 30, attack: 45, defense: 55, specialAttack: 70, specialDefense: 55, speed: 85, total: 340 }
        }
      ]
    };

    const created = await firstValueFrom(service.createTeam(input));
    expect(created.id).toBe('10');
    expect(created.name).toBe('Aqua Squad');
    expect(created.trainer?.name).toBe('Misty');
    expect(created.pokemons.length).toBe(1);
  });

  it('should execute deleteTeam mutation and return true on confirmation', async () => {
    mockGraphQLService.execute = () => of({ removeTeam: { id: '1' } });

    const success = await firstValueFrom(service.deleteTeam('1'));
    expect(success).toBe(true);
  });

  it('should fetch all trainers from local GraphQL server', async () => {
    mockGraphQLService.execute = () =>
      of({
        allTrainers: [
          { id: '1', name: 'Ash Ketchum' },
          { id: '2', name: 'Misty' }
        ]
      });

    const trainers = await firstValueFrom(service.getTrainers());
    expect(trainers.length).toBe(2);
    expect(trainers[0].name).toBe('Ash Ketchum');
    expect(trainers[1].name).toBe('Misty');
  });

  it('should propagate errors when GraphQL mutation fails without silently swallowing', async () => {
    const errorToPropagate = new GraphQLError('Constraint violation', []);
    mockGraphQLService.execute = () => throwError(() => errorToPropagate);

    try {
      await firstValueFrom(service.deleteTeam('999'));
      expect.unreachable('Expected deletion to fail');
    } catch (err: any) {
      expect(err).toBe(errorToPropagate);
    }
  });
});
