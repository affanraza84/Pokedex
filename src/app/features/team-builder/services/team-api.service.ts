import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GraphQLService } from '../../../core/graphql/graphql.service';
import {
  GET_ALL_TEAMS_QUERY,
  CREATE_TEAM_MUTATION,
  DELETE_TEAM_MUTATION
} from '../../../core/graphql/queries/team.queries';
import { Team, TeamInput, TeamMember } from '../../../core/models/team.model';

interface GraphQlTeamNode {
  id: string;
  name: string;
  pokemons: string;
}

/**
 * Service for managing teams against the local json-graphql-server.
 * Local server target: http://localhost:4000/
 */
@Injectable({
  providedIn: 'root'
})
export class TeamApiService {
  private readonly graphqlService = inject(GraphQLService);
  private readonly localEndpoint = 'http://localhost:4000/';
  private readonly storageKey = 'pokedex_local_teams_backup';

  /**
   * Fetches all saved teams from the local GraphQL server.
   *
   * @returns Observable of Team array.
   */
  public getTeams(): Observable<Team[]> {
    return this.graphqlService
      .execute<{ allTeams: GraphQlTeamNode[] }>(this.localEndpoint, GET_ALL_TEAMS_QUERY)
      .pipe(
        map(data => {
          const teams = data.allTeams.map(t => this.deserializeTeam(t));
          this.backupTeams(teams);
          return teams;
        }),
        catchError(error => {
          console.warn(
            '[TeamApiService] Local GraphQL server unreachable (http://localhost:4000/). Using local backup:',
            error.message
          );
          return of(this.getStoredBackupTeams());
        })
      );
  }

  /**
   * Creates a new team on the local GraphQL server.
   *
   * @param input Name and list of Pokémon members.
   * @returns Observable emitting the newly created Team.
   */
  public createTeam(input: TeamInput): Observable<Team> {
    const pokemonsJson = JSON.stringify(input.pokemons);

    return this.graphqlService
      .execute<{ createTeam: GraphQlTeamNode }>(this.localEndpoint, CREATE_TEAM_MUTATION, {
        name: input.name,
        pokemons: pokemonsJson
      })
      .pipe(
        map(data => {
          const created = this.deserializeTeam(data.createTeam);
          const current = this.getStoredBackupTeams();
          this.backupTeams([created, ...current]);
          return created;
        }),
        catchError(error => {
          console.warn('[TeamApiService] Server creation failed:', error.message);
          // If server fails, we propagate error to allow optimistic rollback
          throw error;
        })
      );
  }

  /**
   * Deletes a team by ID from the local GraphQL server.
   *
   * @param id The ID of the team to delete.
   * @returns Observable emitting true when deletion is confirmed.
   */
  public deleteTeam(id: string): Observable<boolean> {
    return this.graphqlService
      .execute<{ removeTeam: { id: string } }>(this.localEndpoint, DELETE_TEAM_MUTATION, { id })
      .pipe(
        map(() => {
          const current = this.getStoredBackupTeams().filter(t => t.id !== id);
          this.backupTeams(current);
          return true;
        }),
        catchError(error => {
          console.warn('[TeamApiService] Server deletion failed:', error.message);
          throw error;
        })
      );
  }

  /**
   * Deserializes a raw GraphQL team record.
   */
  private deserializeTeam(node: GraphQlTeamNode): Team {
    let pokemons: TeamMember[] = [];
    try {
      pokemons = typeof node.pokemons === 'string' ? JSON.parse(node.pokemons) : node.pokemons;
    } catch {
      pokemons = [];
    }

    return {
      id: String(node.id),
      name: node.name,
      pokemons
    };
  }

  private backupTeams(teams: Team[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(teams));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  private getStoredBackupTeams(): Team[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return [
      {
        id: '1',
        name: 'Kanto Starters (Offline Backup)',
        pokemons: [
          {
            id: 1,
            name: 'bulbasaur',
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
            types: ['grass', 'poison'],
            stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 }
          },
          {
            id: 4,
            name: 'charmander',
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
            types: ['fire'],
            stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 }
          },
          {
            id: 7,
            name: 'squirtle',
            sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
            types: ['water'],
            stats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43, total: 314 }
          }
        ]
      }
    ];
  }
}
