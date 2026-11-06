import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphQLService } from '../../core/services/graphql.service';
import {
  GET_ALL_TEAMS_QUERY,
  GET_TEAM_BY_ID_QUERY,
  CREATE_TEAM_MUTATION,
  DELETE_TEAM_MUTATION,
  GET_ALL_TRAINERS_QUERY,
  CREATE_TRAINER_MUTATION
} from './team.queries';
import { Team, TeamInput, TeamMember, Trainer } from '../models/team.model';

interface GraphQlTrainerNode {
  id: string;
  name: string;
  Teams?: Array<{ id: string; name: string }>;
}

interface GraphQlTeamNode {
  id: string;
  name: string;
  trainer_id?: string | null;
  pokemons: string;
  Trainer?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Dedicated service for local Teams & Trainers GraphQL server.
 * Default Endpoint: http://localhost:4000/
 *
 * Implements schema-accurate queries and mutations discovered directly from db.js,
 * properly maps and deserializes member JSON, and propagates typed errors.
 */
@Injectable({
  providedIn: 'root'
})
export class TeamApiService {
  private readonly graphqlService = inject(GraphQLService);
  public readonly localEndpoint = 'http://localhost:4000/';

  /**
   * Fetches all saved teams with their assigned trainer and Pokémon members.
   *
   * @param page Optional page index.
   * @param perPage Optional count per page.
   * @returns Observable of Team array.
   */
  public getTeams(page?: number, perPage?: number): Observable<Team[]> {
    return this.graphqlService
      .execute<{ allTeams: GraphQlTeamNode[] }>(this.localEndpoint, GET_ALL_TEAMS_QUERY, {
        page,
        perPage
      })
      .pipe(map(data => data.allTeams.map(t => this.deserializeTeam(t))));
  }

  /**
   * Retrieves a single team by its unique ID.
   *
   * @param id The ID of the team.
   * @returns Observable of Team or throws if not found.
   */
  public getTeamById(id: string): Observable<Team> {
    return this.graphqlService
      .execute<{ Team: GraphQlTeamNode | null }>(this.localEndpoint, GET_TEAM_BY_ID_QUERY, { id })
      .pipe(
        map(data => {
          if (!data.Team) {
            throw new Error(`Team with ID "${id}" was not found.`);
          }
          return this.deserializeTeam(data.Team);
        })
      );
  }

  /**
   * Creates a new team in the local GraphQL database.
   *
   * @param input Team creation payload including name, members list, and optional trainer ID.
   * @returns Observable emitting the confirmed Team record.
   */
  public createTeam(input: TeamInput): Observable<Team> {
    const pokemonsJson = JSON.stringify(input.pokemons);

    return this.graphqlService
      .execute<{ createTeam: GraphQlTeamNode }>(this.localEndpoint, CREATE_TEAM_MUTATION, {
        name: input.name,
        pokemons: pokemonsJson,
        trainer_id: input.trainer_id || undefined
      })
      .pipe(map(data => this.deserializeTeam(data.createTeam)));
  }

  /**
   * Deletes a team by ID from the local GraphQL database.
   *
   * @param id The ID of the team to delete.
   * @returns Observable emitting true when deletion is confirmed.
   */
  public deleteTeam(id: string): Observable<boolean> {
    return this.graphqlService
      .execute<{ removeTeam: { id: string } }>(this.localEndpoint, DELETE_TEAM_MUTATION, { id })
      .pipe(map(data => !!data.removeTeam?.id));
  }

  /**
   * Fetches all registered trainers from the local GraphQL database.
   *
   * @returns Observable of Trainer array.
   */
  public getTrainers(): Observable<Trainer[]> {
    return this.graphqlService
      .execute<{ allTrainers: GraphQlTrainerNode[] }>(this.localEndpoint, GET_ALL_TRAINERS_QUERY)
      .pipe(
        map(data =>
          data.allTrainers.map(t => ({
            id: String(t.id),
            name: t.name
          }))
        )
      );
  }

  /**
   * Creates a new Trainer in the local GraphQL database.
   *
   * @param name Trainer name.
   * @returns Observable emitting the created Trainer.
   */
  public createTrainer(name: string): Observable<Trainer> {
    return this.graphqlService
      .execute<{ createTrainer: GraphQlTrainerNode }>(this.localEndpoint, CREATE_TRAINER_MUTATION, {
        name
      })
      .pipe(
        map(data => ({
          id: String(data.createTrainer.id),
          name: data.createTrainer.name
        }))
      );
  }

  /**
   * Deserializes a raw GraphQL team record into the application's domain model.
   */
  public deserializeTeam(node: GraphQlTeamNode): Team {
    let pokemons: TeamMember[] = [];
    try {
      pokemons = typeof node.pokemons === 'string' ? JSON.parse(node.pokemons) : node.pokemons;
    } catch {
      pokemons = [];
    }

    return {
      id: String(node.id),
      name: node.name,
      trainer_id: node.trainer_id ? String(node.trainer_id) : null,
      trainer: node.Trainer
        ? {
            id: String(node.Trainer.id),
            name: node.Trainer.name
          }
        : null,
      pokemons
    };
  }
}
