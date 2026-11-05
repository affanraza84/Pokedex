import { FormControl } from '@angular/forms';
import { firstValueFrom, isObservable } from 'rxjs';
import { uniqueTeamNameValidator } from './unique-team-name.validator';
import { TeamStore } from '../state/team.store';

describe('uniqueTeamNameValidator', () => {
  let mockTeamStore: Partial<TeamStore>;

  beforeEach(() => {
    mockTeamStore = {
      isNameTaken: (name: string) => name.toLowerCase() === 'champions'
    };
  });

  it('should return null if control value is empty or short', async () => {
    const validator = uniqueTeamNameValidator(mockTeamStore as TeamStore, 10);
    const control = new FormControl('ab');

    const result$ = validator(control);
    expect(isObservable(result$)).toBe(true);

    const result = await firstValueFrom(result$ as any);
    expect(result).toBeNull();
  });

  it('should return nameTaken error when team name already exists', async () => {
    const validator = uniqueTeamNameValidator(mockTeamStore as TeamStore, 10);
    const control = new FormControl('Champions');

    const result$ = validator(control);
    const result = await firstValueFrom(result$ as any);

    expect(result).toEqual({ nameTaken: { value: 'Champions' } });
  });

  it('should return null when team name is unique', async () => {
    const validator = uniqueTeamNameValidator(mockTeamStore as TeamStore, 10);
    const control = new FormControl('Mystic Warriors');

    const result$ = validator(control);
    const result = await firstValueFrom(result$ as any);

    expect(result).toBeNull();
  });
});
