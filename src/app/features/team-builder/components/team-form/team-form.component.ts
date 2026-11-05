import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Pokemon } from '../../../../core/models/pokemon.model';
import { TeamMember, TeamInput } from '../../../../core/models/team.model';
import { TeamStore } from '../../store/team.store';
import { uniqueTeamNameValidator } from '../../validators/unique-team-name.validator';
import { PokemonAutocompleteComponent } from '../pokemon-autocomplete/pokemon-autocomplete.component';
import { TeamChipsComponent } from '../team-chips/team-chips.component';

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PokemonAutocompleteComponent,
    TeamChipsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="team-form-card">
      <div class="card-header">
        <h2 class="card-title">Create New Team</h2>
        <span class="count-badge" [class.badge-valid]="isTeamSizeValid()">
          {{ selectedMembers().length }} / 6 Pokémon
        </span>
      </div>

      <form [formGroup]="teamForm" (ngSubmit)="onSubmit()" class="form-content">
        <!-- Team Name Input -->
        <div class="form-group">
          <label for="team-name" class="form-label">
            Team Name <span class="required">*</span>
          </label>
          <div class="input-container">
            <input
              id="team-name"
              type="text"
              class="form-input"
              [class.input-invalid]="isNameInvalid()"
              formControlName="name"
              placeholder="e.g., Kanto Dream Team (3-30 chars)"
              autocomplete="off" />
            @if (nameControl.pending) {
              <span class="pending-spinner" title="Checking name uniqueness...">⏳</span>
            }
          </div>

          <!-- Inline validation errors ONLY after touched or dirty -->
          @if (isNameInvalid()) {
            <div class="error-messages" role="alert">
              @if (nameControl.hasError('required')) {
                <span class="error-text">Team name is required.</span>
              }
              @if (nameControl.hasError('minlength')) {
                <span class="error-text">Team name must be at least 3 characters.</span>
              }
              @if (nameControl.hasError('maxlength')) {
                <span class="error-text">Team name cannot exceed 30 characters.</span>
              }
              @if (nameControl.hasError('nameTaken')) {
                <span class="error-text">A team with this name already exists.</span>
              }
            </div>
          }
        </div>

        <!-- Pokémon Autocomplete Selector -->
        <div class="form-group">
          <label class="form-label">Select Pokémon</label>
          <app-pokemon-autocomplete
            [availablePokemons]="availablePokemons()"
            [disabled]="selectedMembers().length >= 6"
            (selectPokemon)="onAddMember($event)" />
        </div>

        <!-- Selected Members Chips -->
        <div class="form-group">
          <label class="form-label">Team Members (Min 1, Max 6)</label>
          <app-team-chips
            [members]="selectedMembers()"
            (remove)="onRemoveMember($event)" />

          <!-- Inline validation error for members count -->
          @if (showMembersError()) {
            <div class="error-messages" role="alert">
              @if (selectedMembers().length === 0) {
                <span class="error-text">Please add at least 1 Pokémon to the team.</span>
              } @else if (selectedMembers().length > 6) {
                <span class="error-text">A team cannot have more than 6 Pokémon.</span>
              }
            </div>
          }
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button
            type="submit"
            class="submit-btn"
            [disabled]="!isFormReadyToSubmit() || isSaving()">
            @if (isSaving()) {
              <span>Saving...</span>
            } @else {
              <span>Create Team</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .team-form-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      padding: 24px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .card-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .count-badge {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      background: #f1f5f9;
      color: #64748b;
    }
    .count-badge.badge-valid {
      background: #dcfce7;
      color: #15803d;
    }
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #334155;
    }
    .required {
      color: #ef4444;
    }
    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.95rem;
      color: #0f172a;
      outline: none;
      transition: all 0.2s;
    }
    .form-input:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
    .form-input.input-invalid {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .pending-spinner {
      position: absolute;
      right: 12px;
      font-size: 1rem;
    }
    .error-messages {
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: fadeIn 0.15s ease;
    }
    .error-text {
      color: #ef4444;
      font-size: 0.82rem;
      font-weight: 500;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .submit-btn {
      padding: 12px 28px;
      background: #ef4444;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
    }
    .submit-btn:hover:not(:disabled) {
      background: #dc2626;
      box-shadow: 0 6px 12px -2px rgba(239, 68, 68, 0.4);
    }
    .submit-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      box-shadow: none;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TeamFormComponent {
  private readonly teamStore = inject(TeamStore);

  public readonly availablePokemons = input<Pokemon[]>([]);
  public readonly isSaving = input<boolean>(false);

  public readonly teamSubmitted = output<TeamInput>();
  public readonly membersChanged = output<TeamMember[]>();

  public readonly selectedMembers = signal<TeamMember[]>([]);
  public readonly membersTouched = signal<boolean>(false);

  // Reactive Form definition
  public readonly teamForm = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ],
      asyncValidators: [uniqueTeamNameValidator(this.teamStore)]
    })
  });

  get nameControl(): FormControl<string> {
    return this.teamForm.controls.name;
  }

  // Requirement E: Inline validation only after dirty or touched
  public isNameInvalid(): boolean {
    const ctrl = this.nameControl;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  public isTeamSizeValid = computed(() => {
    const count = this.selectedMembers().length;
    return count >= 1 && count <= 6;
  });

  public showMembersError = computed(() => {
    return this.membersTouched() && !this.isTeamSizeValid();
  });

  public isFormReadyToSubmit = computed(() => {
    return this.teamForm.valid && this.isTeamSizeValid() && !this.nameControl.pending;
  });

  onAddMember(pokemon: Pokemon): void {
    if (this.selectedMembers().length >= 6) return;

    const newMember: TeamMember = {
      id: pokemon.id,
      name: pokemon.name,
      sprite: pokemon.sprite,
      types: pokemon.types,
      stats: pokemon.stats
    };

    const updated = [...this.selectedMembers(), newMember];
    this.selectedMembers.set(updated);
    this.membersTouched.set(true);
    this.membersChanged.emit(updated);
  }

  onRemoveMember(index: number): void {
    const updated = this.selectedMembers().filter((_, i) => i !== index);
    this.selectedMembers.set(updated);
    this.membersTouched.set(true);
    this.membersChanged.emit(updated);
  }

  onSubmit(): void {
    this.teamForm.markAllAsTouched();
    this.membersTouched.set(true);

    if (!this.isFormReadyToSubmit()) return;

    const name = this.nameControl.value.trim();
    const pokemons = this.selectedMembers();

    this.teamSubmitted.emit({ name, pokemons });

    // Reset form after submit
    this.teamForm.reset();
    this.selectedMembers.set([]);
    this.membersTouched.set(false);
    this.membersChanged.emit([]);
  }
}
