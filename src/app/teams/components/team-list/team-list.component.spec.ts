import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamListComponent } from './team-list.component';
import { Team } from '../../models/team.model';

describe('TeamListComponent', () => {
  let component: TeamListComponent;
  let fixture: ComponentFixture<TeamListComponent>;

  const mockTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Fire Squad',
      isOptimistic: false,
      pokemons: [
        {
          id: 4,
          name: 'charmander',
          sprite: 'https://example.com/char.png',
          types: ['fire'],
          stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 }
        }
      ]
    },
    {
      id: 'team-opt',
      name: 'Water Squad',
      isOptimistic: true,
      pokemons: [
        {
          id: 7,
          name: 'squirtle',
          sprite: 'https://example.com/squirtle.png',
          types: ['water'],
          stats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43, total: 314 }
        }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render empty state when no teams exist and not loading', () => {
    fixture.componentRef.setInput('teams', []);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('No teams saved yet');
  });

  it('should render loading state when loading and teams are empty', () => {
    fixture.componentRef.setInput('teams', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const loadingEl = fixture.nativeElement.querySelector('.loading-state');
    expect(loadingEl).toBeTruthy();
    expect(loadingEl.textContent).toContain('Loading your teams');
  });

  it('should render teams and display optimistic syncing badge', () => {
    fixture.componentRef.setInput('teams', mockTeams);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const teamCards = fixture.nativeElement.querySelectorAll('.team-card');
    expect(teamCards.length).toBe(2);

    const syncingBadge = fixture.nativeElement.querySelector('.optimistic-badge');
    expect(syncingBadge).toBeTruthy();
    expect(syncingBadge.textContent).toContain('Syncing...');

    // Delete button for optimistic team should be disabled
    const deleteBtns = fixture.nativeElement.querySelectorAll('.delete-btn');
    expect(deleteBtns[1].disabled).toBe(true);
    expect(deleteBtns[0].disabled).toBe(false);
  });

  it('should render error banner and emit retryLoad on click', () => {
    fixture.componentRef.setInput('teams', []);
    fixture.componentRef.setInput('error', 'Network failure connecting to GraphQL server');
    fixture.detectChanges();

    const errorBanner = fixture.nativeElement.querySelector('.team-error-banner');
    expect(errorBanner).toBeTruthy();
    expect(errorBanner.textContent).toContain('Network failure connecting to GraphQL server');

    let retried = false;
    component.retryLoad.subscribe(() => {
      retried = true;
    });

    const retryBtn = errorBanner.querySelector('.retry-load-btn') as HTMLButtonElement;
    retryBtn.click();
    expect(retried).toBe(true);
  });

  it('should emit selectTeam when clicking a team card', () => {
    fixture.componentRef.setInput('teams', mockTeams);
    fixture.detectChanges();

    let selected: Team | null = null;
    component.selectTeam.subscribe(t => {
      selected = t;
    });

    const teamCards = fixture.nativeElement.querySelectorAll('.team-card');
    (teamCards[0] as HTMLElement).click();
    expect(selected).toEqual(mockTeams[0]);
  });

  it('should emit deleteTeam when clicking delete button', () => {
    fixture.componentRef.setInput('teams', mockTeams);
    fixture.detectChanges();

    let deletedId: string | null = null;
    component.deleteTeam.subscribe(id => {
      deletedId = id;
    });

    const deleteBtns = fixture.nativeElement.querySelectorAll('.delete-btn');
    (deleteBtns[0] as HTMLButtonElement).click();
    expect(deletedId).toBe('team-1');
  });
});
