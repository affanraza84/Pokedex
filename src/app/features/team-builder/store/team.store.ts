import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay, distinctUntilChanged, tap, catchError } from 'rxjs/operators';
import { Team, TeamInput } from '../../../core/models/team.model';
import { TeamApiService } from '../services/team-api.service';

export interface TeamState {
  teams: Team[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const INITIAL_STATE: TeamState = {
  teams: [],
  loading: false,
  saving: false,
  error: null,
  notification: null
};

/**
 * Custom RxJS-based reactive store for managing Teams.
 * Features optimistic team creation with automatic rollback on network/server failure.
 */
@Injectable({
  providedIn: 'root'
})
export class TeamStore {
  private readonly apiService = inject(TeamApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly state$ = new BehaviorSubject<TeamState>(INITIAL_STATE);

  /**
   * Observable stream of all teams.
   */
  public readonly teams$: Observable<Team[]> = this.state$.pipe(
    map(s => s.teams),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Observable stream of loading status.
   */
  public readonly loading$: Observable<boolean> = this.state$.pipe(
    map(s => s.loading),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Observable stream of saving status during mutations.
   */
  public readonly saving$: Observable<boolean> = this.state$.pipe(
    map(s => s.saving),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Observable stream of active error messages.
   */
  public readonly error$: Observable<string | null> = this.state$.pipe(
    map(s => s.error),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Observable stream of transient notifications.
   */
  public readonly notification$: Observable<{ message: string; type: 'success' | 'error' | 'info' } | null> =
    this.state$.pipe(
      map(s => s.notification),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  constructor() {
    this.loadTeams();
  }

  /**
   * Fetches all teams from the GraphQL server.
   */
  public loadTeams(): void {
    this.updateState({ loading: true, error: null });

    this.apiService
      .getTeams()
      .pipe(
        tap(teams => {
          this.updateState({ teams, loading: false, error: null });
        }),
        catchError(err => {
          this.updateState({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to fetch teams'
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Creates a team optimistically.
   * Immediately updates UI state; if the server fails, rolls back to previous state.
   *
   * @param input Name and list of Pokémon members.
   */
  public createTeam(input: TeamInput): void {
    const previousTeams = [...this.state$.getValue().teams];
    const tempId = `optimistic-${Date.now()}`;

    // 1. Optimistic candidate
    const optimisticTeam: Team = {
      id: tempId,
      name: input.name,
      pokemons: [...input.pokemons],
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    // 2. Optimistic UI update
    this.updateState({
      teams: [optimisticTeam, ...previousTeams],
      saving: true,
      error: null,
      notification: { message: `Adding team "${input.name}"...`, type: 'info' }
    });

    // 3. Dispatch GraphQL mutation
    this.apiService
      .createTeam(input)
      .pipe(
        tap(serverConfirmedTeam => {
          const currentTeams = this.state$.getValue().teams;
          // Replace optimistic item with server confirmed item
          const updatedTeams = currentTeams.map(t =>
            t.id === tempId ? { ...serverConfirmedTeam, isOptimistic: false } : t
          );
          this.updateState({
            teams: updatedTeams,
            saving: false,
            notification: {
              message: `Team "${serverConfirmedTeam.name}" created successfully!`,
              type: 'success'
            }
          });
        }),
        catchError(err => {
          console.error('[TeamStore] Server mutation failed. Performing optimistic rollback!', err);
          // 4. ROLLBACK to previous state
          this.updateState({
            teams: previousTeams,
            saving: false,
            error: 'Failed to save team to server. Optimistic change rolled back.',
            notification: {
              message: `Could not save team "${input.name}". Rolled back.`,
              type: 'error'
            }
          });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Deletes a team by ID optimistically with rollback on failure.
   *
   * @param id The ID of the team to delete.
   */
  public deleteTeam(id: string): void {
    const previousTeams = [...this.state$.getValue().teams];
    const targetTeam = previousTeams.find(t => t.id === id);
    if (!targetTeam) return;

    // Optimistic remove
    this.updateState({
      teams: previousTeams.filter(t => t.id !== id),
      notification: { message: `Removing team "${targetTeam.name}"...`, type: 'info' }
    });

    this.apiService
      .deleteTeam(id)
      .pipe(
        tap(() => {
          this.updateState({
            notification: { message: `Team "${targetTeam.name}" deleted.`, type: 'success' }
          });
        }),
        catchError(err => {
          console.error('[TeamStore] Deletion failed. Rolling back!', err);
          this.updateState({
            teams: previousTeams,
            error: 'Failed to delete team on server. Restored team.',
            notification: {
              message: `Failed to delete team "${targetTeam.name}". Rolled back.`,
              type: 'error'
            }
          });
          return of(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Clears active transient notification.
   */
  public clearNotification(): void {
    this.updateState({ notification: null });
  }

  /**
   * Checks whether a team name already exists (case-insensitive).
   *
   * @param name Team name to check.
   * @returns boolean true if team name already exists.
   */
  public isNameTaken(name: string): boolean {
    const trimmed = name.trim().toLowerCase();
    return this.state$.getValue().teams.some(t => t.name.trim().toLowerCase() === trimmed);
  }

  private updateState(partial: Partial<TeamState>): void {
    this.state$.next({
      ...this.state$.getValue(),
      ...partial
    });
  }
}
