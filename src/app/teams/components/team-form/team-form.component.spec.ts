import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TeamFormComponent } from './team-form.component';
import { TeamStore } from '../../state/team.store';
import { Pokemon } from '../../../pokedex/models/pokemon.model';

describe('TeamFormComponent (Reactive Forms, Async Validation & Rules)', () => {
  let component: TeamFormComponent;
  let fixture: ComponentFixture<TeamFormComponent>;
  let mockTeamStore: any;

  const samplePokemon1: Pokemon = {
    id: 1,
    name: 'bulbasaur',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    artwork: '',
    types: ['grass', 'poison'],
    stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
    abilities: [{ name: 'overgrow', isHidden: false }]
  };

  const samplePokemon2: Pokemon = {
    id: 4,
    name: 'charmander',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
    artwork: '',
    types: ['fire'],
    stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 },
    abilities: [{ name: 'blaze', isHidden: false }]
  };

  beforeEach(async () => {
    mockTeamStore = {
      isNameTaken: vi.fn((name: string) => name.toLowerCase() === 'existing squad'),
      teams$: of([])
    };

    await TestBed.configureTestingModule({
      imports: [TeamFormComponent],
      providers: [
        { provide: TeamStore, useValue: mockTeamStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with an empty, pristine, untouched form', () => {
    expect(component.teamForm.pristine).toBe(true);
    expect(component.teamForm.untouched).toBe(true);
    expect(component.nameControl.value).toBe('');
    expect(component.selectedMembers().length).toBe(0);
    // Inline validation error must NOT be shown when untouched and pristine
    expect(component.isNameInvalid()).toBe(false);
    expect(component.showMembersError()).toBe(false);
  });

  it('should validate team name required, minlength (3), and maxlength (30)', () => {
    const ctrl = component.nameControl;

    // Required
    ctrl.setValue('');
    ctrl.markAsTouched();
    expect(ctrl.hasError('required')).toBe(true);
    expect(component.isNameInvalid()).toBe(true);

    // Minlength (2 chars < 3)
    ctrl.setValue('Ab');
    expect(ctrl.hasError('minlength')).toBe(true);

    // Valid length
    ctrl.setValue('Valid Team');
    expect(ctrl.hasError('minlength')).toBe(false);
    expect(ctrl.hasError('maxlength')).toBe(false);

    // Maxlength (31 chars > 30)
    ctrl.setValue('A'.repeat(31));
    expect(ctrl.hasError('maxlength')).toBe(true);
  });

  it('should validate async unique team name with debounce', async () => {
    const ctrl = component.nameControl;

    // Non-taken name
    ctrl.setValue('Unique Super Team');
    // Wait debounce (300ms)
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(ctrl.hasError('nameTaken')).toBe(false);

    // Taken name ('Existing Squad')
    ctrl.setValue('Existing Squad');
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(ctrl.hasError('nameTaken')).toBe(true);
    expect(mockTeamStore.isNameTaken).toHaveBeenCalledWith('Existing Squad');
  });

  it('should require minimum 1 and maximum 6 Pokémon', () => {
    expect(component.isTeamSizeValid()).toBe(false);

    // Add 1 Pokémon -> Valid
    component.onAddMember(samplePokemon1);
    expect(component.selectedMembers().length).toBe(1);
    expect(component.isTeamSizeValid()).toBe(true);

    // Add up to 6
    for (let i = 2; i <= 6; i++) {
      component.onAddMember({
        ...samplePokemon2,
        id: i,
        name: `poke-${i}`
      });
    }
    expect(component.selectedMembers().length).toBe(6);
    expect(component.isTeamSizeValid()).toBe(true);

    // Attempting to add 7th should be rejected
    component.onAddMember({
      ...samplePokemon2,
      id: 7,
      name: 'poke-7'
    });
    expect(component.selectedMembers().length).toBe(6);
  });

  it('should prevent duplicate Pokémon in the same team', () => {
    component.onAddMember(samplePokemon1);
    expect(component.selectedMembers().length).toBe(1);
    expect(component.duplicateError()).toBeNull();

    // Attempt to add samplePokemon1 again
    component.onAddMember(samplePokemon1);
    expect(component.selectedMembers().length).toBe(1);
    expect(component.duplicateError()).toContain('bulbasaur');
    expect(component.duplicateError()).toContain('Duplicate Pokémon are not allowed');

    // Adding a different Pokémon clears duplicate error
    component.onAddMember(samplePokemon2);
    expect(component.selectedMembers().length).toBe(2);
    expect(component.duplicateError()).toBeNull();
  });

  it('should allow removing selected Pokémon', () => {
    component.onAddMember(samplePokemon1);
    component.onAddMember(samplePokemon2);
    expect(component.selectedMembers().length).toBe(2);

    component.onRemoveMember(0);
    expect(component.selectedMembers().length).toBe(1);
    expect(component.selectedMembers()[0].name).toBe('charmander');
  });

  it('should emit teamSubmitted when form is valid, and keep form until resetForm is called', async () => {
    let submittedData: any = null;
    component.teamSubmitted.subscribe(data => {
      submittedData = data;
    });

    component.nameControl.setValue('Champions League');
    // Wait async validation timer (300ms)
    await new Promise(resolve => setTimeout(resolve, 400));
    component.onAddMember(samplePokemon1);
    fixture.detectChanges();

    expect(component.nameControl.valid).toBe(true);
    expect(component.isTeamSizeValid()).toBe(true);
    expect(component.isFormReadyToSubmit()).toBe(true);
    component.onSubmit();

    expect(submittedData).toEqual({
      name: 'Champions League',
      pokemons: [expect.objectContaining({ name: 'bulbasaur' })]
    });

    // Form retains values until server mutation succeeds and resetForm() is triggered!
    expect(component.nameControl.value).toBe('Champions League');
    expect(component.selectedMembers().length).toBe(1);

    // Call resetForm() simulating server success
    component.resetForm();
    expect(component.nameControl.value).toBe('');
    expect(component.selectedMembers().length).toBe(0);
  });
});
