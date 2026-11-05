import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, timer, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TeamStore } from '../state/team.store';

/**
 * Factory for debounced async unique team name validator.
 *
 * @param teamStore Instance of TeamStore to verify uniqueness against existing teams.
 * @param debounceMs Milliseconds to debounce validation requests.
 * @returns AsyncValidatorFn
 */
export function uniqueTeamNameValidator(teamStore: TeamStore, debounceMs = 300): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || typeof control.value !== 'string') {
      return of(null);
    }

    const trimmed = control.value.trim();
    if (trimmed.length < 3) {
      return of(null);
    }

    return timer(debounceMs).pipe(
      switchMap(() => {
        const isTaken = teamStore.isNameTaken(trimmed);
        return of(isTaken ? { nameTaken: { value: control.value } } : null);
      })
    );
  };
}
