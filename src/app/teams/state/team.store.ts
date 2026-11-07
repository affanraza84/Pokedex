import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay, distinctUntilChanged, tap, catchError } from 'rxjs/operators';
import { Team, TeamInput } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';

export interface TeamNotification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface TeamState {
  teams: Team[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  notification: TeamNotification | null;
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
 * Features optimistic team creation and deletion with automatic rollback on server error.
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
  public readonly notification$: Observable<TeamNotification | null> = this.state$.pipe(
    map(s => s.notification),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    this.loadTeams();
  }

  /**
   * Fetches all existing teams from the GraphQL server.
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
          const message = err instanceof Error ? err.message : 'Failed to fetch teams from server';
          this.updateState({
            loading: false,
            error: message,
            notification: { message, type: 'error' }
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Optimistically creates a team.
   * Immediately updates the UI with an optimistic candidate before the server responds.
   * If the server mutation fails, rolls back the update and exposes the error to the UI.
   *
   * @param input Name, members list, and optional trainer ID.
   * @param onSuccess Optional callback invoked only after server confirms mutation.
   * @param onError Optional callback invoked on mutation failure.
   */
  public createTeam(
    input: TeamInput,
    onSuccess?: (confirmedTeam: Team) => void,
    onError?: (error: Error) => void
  ): void {
    const previousTeams = [...this.state$.getValue().teams];
    const tempId = `optimistic-${Date.now()}`;

    // 1. Construct optimistic team candidate
    const optimisticTeam: Team = {
      id: tempId,
      name: input.name,
      trainer_id: input.trainer_id ?? null,
      pokemons: [...input.pokemons],
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    // 2. Immediately update the UI before the server responds
    this.updateState({
      teams: [optimisticTeam, ...previousTeams],
      saving: true,
      error: null,
      notification: { message: `Adding team "${input.name}"...`, type: 'info' }
    });

    // 3. Dispatch server mutation
    this.apiService
      .createTeam(input)
      .pipe(
        tap(serverConfirmedTeam => {
          const currentTeams = this.state$.getValue().teams;
          // Replace optimistic placeholder with server-confirmed team
          const updatedTeams = currentTeams.map(t =>
            t.id === tempId ? { ...serverConfirmedTeam, isOptimistic: false } : t
          );

          this.updateState({
            teams: updatedTeams,
            saving: false,
            error: null,
            notification: {
              message: `Team "${serverConfirmedTeam.name}" saved successfully!`,
              type: 'success'
            }
          });

          onSuccess?.(serverConfirmedTeam);
        }),
        catchError(err => {
          console.error('[TeamStore] Server mutation failed. Performing optimistic rollback!', err);
          const errorMessage = err instanceof Error ? err.message : 'Server error creating team';

          // 4. Rollback the optimistic update to previous state
          this.updateState({
            teams: previousTeams,
            saving: false,
            error: `Failed to create team on server. Optimistic change rolled back: ${errorMessage}`,
            notification: {
              message: `Could not save team "${input.name}". Changes rolled back.`,
              type: 'error'
            }
          });

          onError?.(err instanceof Error ? err : new Error(errorMessage));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Optimistically deletes a team by ID with automatic rollback on error.
   *
   * @param id The ID of the team to delete.
   */
  public deleteTeam(id: string): void {
    const previousTeams = [...this.state$.getValue().teams];
    const targetTeam = previousTeams.find(t => t.id === id);
    if (!targetTeam) return;

    // Immediately remove from UI
    this.updateState({
      teams: previousTeams.filter(t => t.id !== id),
      error: null,
      notification: { message: `Deleting team "${targetTeam.name}"...`, type: 'info' }
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
          console.error('[TeamStore] Server deletion failed. Performing rollback!', err);
          const errorMessage = err instanceof Error ? err.message : 'Server error deleting team';

          // Rollback to previous state
          this.updateState({
            teams: previousTeams,
            error: `Failed to delete team on server. Restored team: ${errorMessage}`,
            notification: {
              message: `Failed to delete team "${targetTeam.name}". Restored.`,
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
   * Clears the active error message.
   */
  public clearError(): void {
    this.updateState({ error: null });
  }

  /**
   * Clears the active transient notification.
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
