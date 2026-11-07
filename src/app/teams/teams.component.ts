import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  untracked,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TeamStore } from './state/team.store';
import { PokemonSelectors } from '../pokedex/state/pokemon.selectors';
import { TeamFormComponent } from './components/team-form/team-form.component';
import { TeamListComponent } from './components/team-list/team-list.component';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { Team, TeamInput, TeamMember } from './models/team.model';
import { TypeDistributionItem } from '../pokedex/models/pokemon.model';
import { TypeColorPipe } from '../shared/pipes/type-color.pipe';
import { FALLBACK_POKEMONS } from '../core/data/pokemon-fallback.data';

const SELECTED_TEAM_STORAGE_KEY = 'pokedex_selected_team_id';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
};

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    TeamFormComponent,
    TeamListComponent,
    ToastComponent,
    TypeColorPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="team-builder-view">
      <section class="hero-header">
        <h1 class="hero-title">Team Builder</h1>
        <p class="hero-subtitle">
          Construct custom 1-6 Pokémon squads, validate unique names, and analyze team type synergy.
        </p>
      </section>

      <!-- Type Distribution & Base Stats Synergy Widget (computed() signals) -->
      @if (activeTeamMembers().length > 0) {
        <aside class="synergy-card">
          <div class="synergy-header">
            <div class="synergy-title-group">
              <span class="synergy-icon">⚡</span>
              <div>
                <h3 class="synergy-title">
                  Team Synergy & Stat Analysis
                  @if (selectedTeam(); as st) {
                    <span>(Viewing: {{ st.name }})</span>
                  } @else {
                    <span>(Current Draft)</span>
                  }
                </h3>
                <div class="stats-summary-row">
                  <span class="summary-pill">
                    Total Base Stats: <strong>{{ teamTotalBaseStats() }}</strong>
                  </span>
                  <span class="summary-pill">
                    Avg / Pokémon: <strong>{{ teamAverageBaseStats() }}</strong>
                  </span>
                  <span class="summary-pill" [class.complete]="isTeamComplete()">
                    Squad: <strong>{{ activeTeamMembers().length }} / 6</strong>
                  </span>
                </div>
              </div>
            </div>
            @if (selectedTeam()) {
              <button
                type="button"
                class="view-draft-btn"
                (click)="onClearSelectedTeam()">
                Switch to Draft Synergy
              </button>
            }
          </div>

          <div class="types-bar-grid">
            @for (item of teamTypeDistribution(); track item.type) {
              @let color = item.type | typeColor;
              <div class="type-synergy-item">
                <div class="item-header">
                  <span
                    class="type-pill"
                    [style.backgroundColor]="color.bg"
                    [style.color]="color.text">
                    {{ item.type | uppercase }}
                  </span>
                  <span class="type-stats">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
                <div class="synergy-track">
                  <div
                    class="synergy-fill"
                    [style.backgroundColor]="color.bg"
                    [style.width.%]="item.percentage"></div>
                </div>
              </div>
            }
          </div>
        </aside>
      }

      <!-- Main Layout: Form + Team List -->
      <div class="builder-grid">
        <div class="form-col">
          <app-team-form
            [availablePokemons]="autocompleteList()"
            [isSaving]="saving()"
            (teamSubmitted)="onTeamSubmitted($event)"
            (membersChanged)="onDraftMembersChanged($event)" />
        </div>

        <div class="list-col">
          <app-team-list
            [teams]="teams()"
            [loading]="loading()"
            [selectedTeamId]="selectedTeam()?.id ?? null"
            (deleteTeam)="onDeleteTeam($event)"
            (selectTeam)="onSelectTeam($event)" />
        </div>
      </div>

      <!-- Non-blocking toast notification -->
      <app-toast
        [toast]="notification()"
        (closed)="onCloseToast()" />
    </div>
  `,
  styles: [`
    .team-builder-view {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }
    .hero-header {
      margin-bottom: 28px;
    }
    .hero-title {
      font-size: 2.2rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin: 0 0 8px;
    }
    .hero-subtitle {
      font-size: 1rem;
      color: #64748b;
      margin: 0;
    }
    .synergy-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-bottom: 28px;
    }
    .synergy-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .synergy-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .synergy-icon {
      font-size: 1.25rem;
    }
    .synergy-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .synergy-title span {
      font-weight: 500;
      color: #64748b;
      font-size: 0.95rem;
      margin-left: 6px;
    }
    .stats-summary-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }
    .summary-pill {
      font-size: 0.78rem;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 10px;
      border-radius: 9999px;
    }
    .summary-pill strong {
      color: #0f172a;
    }
    .summary-pill.complete {
      background: #dcfce7;
      color: #15803d;
    }
    .summary-pill.complete strong {
      color: #15803d;
    }
    .view-draft-btn {
      padding: 6px 14px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }
    .view-draft-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .types-bar-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 14px;
    }
    .type-synergy-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .type-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .type-stats {
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
    }
    .synergy-track {
      height: 6px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }
    .synergy-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }
    .builder-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 28px;
    }
    @media (min-width: 900px) {
      .builder-grid {
        grid-template-columns: 480px 1fr;
        align-items: start;
      }
    }
  `]
})
export class TeamsComponent {
  private readonly teamStore = inject(TeamStore);
  private readonly pokemonSelectors = inject(PokemonSelectors);

  public readonly teams = toSignal(this.teamStore.teams$, { initialValue: [] });
  public readonly loading = toSignal(this.teamStore.loading$, { initialValue: false });
  public readonly saving = toSignal(this.teamStore.saving$, { initialValue: false });
  public readonly storeNotification = toSignal(this.teamStore.notification$, { initialValue: null });
  private readonly loadedPokemons = toSignal(this.pokemonSelectors.pokemons$, { initialValue: [] });

  public readonly selectedTeam = signal<Team | null>(null);
  public readonly draftMembers = signal<TeamMember[]>([]);

  public readonly autocompleteList = computed(() => {
    const fromPokedex = this.loadedPokemons();
    if (fromPokedex.length > 0) {
      const ids = new Set(fromPokedex.map(p => p.id));
      const additional = FALLBACK_POKEMONS.filter(p => !ids.has(p.id));
      return [...fromPokedex, ...additional];
    }
    return FALLBACK_POKEMONS;
  });

  public readonly activeTeamMembers = computed(() => {
    const st = this.selectedTeam();
    if (st) return st.pokemons;
    return this.draftMembers();
  });

  /**
   * Requirement 2: Derived team total base stats across all members using computed().
   */
  public readonly teamTotalBaseStats = computed<number>(() => {
    const members = this.activeTeamMembers();
    return members.reduce((sum, member) => {
      if (!member.stats) return sum;
      const { hp, attack, defense, specialAttack, specialDefense, speed } = member.stats;
      return sum + (hp + attack + defense + specialAttack + specialDefense + speed);
    }, 0);
  });

  /**
   * Derived average base stats per team member using computed().
   */
  public readonly teamAverageBaseStats = computed<number>(() => {
    const members = this.activeTeamMembers();
    if (members.length === 0) return 0;
    return Math.round(this.teamTotalBaseStats() / members.length);
  });

  /**
   * Derived team completeness flag using computed().
   */
  public readonly isTeamComplete = computed<boolean>(() => {
    return this.activeTeamMembers().length === 6;
  });

  /**
   * Requirement 2: Derived team type distribution and percentages using computed().
   */
  public readonly teamTypeDistribution = computed<TypeDistributionItem[]>(() => {
    const members = this.activeTeamMembers();
    if (members.length === 0) return [];

    const typeCountMap = new Map<string, number>();
    let totalTypeOccurrences = 0;

    for (const member of members) {
      for (const t of member.types) {
        const current = typeCountMap.get(t) ?? 0;
        typeCountMap.set(t, current + 1);
        totalTypeOccurrences++;
      }
    }

    const items: TypeDistributionItem[] = [];
    typeCountMap.forEach((count, type) => {
      const percentage = Math.round((count / totalTypeOccurrences) * 100);
      items.push({ type, count, percentage });
    });

    return items.sort((a, b) => b.count - a.count);
  });

  public readonly notification = computed(() => {
    const raw = this.storeNotification();
    if (!raw) return null;
    return { text: raw.message, type: raw.type };
  });

  constructor() {
    const savedTeamId = safeLocalStorage.getItem(SELECTED_TEAM_STORAGE_KEY);

    // Restore selected team when teams list loads from store
    effect(() => {
      const availableTeams = this.teams();
      if (savedTeamId && !untracked(this.selectedTeam) && availableTeams.length > 0) {
        const found = availableTeams.find(t => t.id === savedTeamId);
        if (found) {
          this.selectedTeam.set(found);
        }
      }
    });

    // Requirement 3: Use effect() to persist the selected team in localStorage
    effect(() => {
      const current = this.selectedTeam();
      if (current) {
        safeLocalStorage.setItem(SELECTED_TEAM_STORAGE_KEY, current.id);
      } else {
        safeLocalStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
      }
    });
  }

  private readonly teamFormRef = viewChild(TeamFormComponent);

  onDraftMembersChanged(members: TeamMember[]): void {
    this.draftMembers.set(members);
    if (this.selectedTeam()) {
      this.selectedTeam.set(null);
    }
  }

  onTeamSubmitted(input: TeamInput): void {
    // Optimistic creation with rollback on failure; reset form ONLY on success
    this.teamStore.createTeam(input, () => {
      this.teamFormRef()?.resetForm();
    });
  }

  onDeleteTeam(id: string): void {
    if (this.selectedTeam()?.id === id) {
      this.selectedTeam.set(null);
    }
    this.teamStore.deleteTeam(id);
  }

  onSelectTeam(team: Team): void {
    this.selectedTeam.set(team);
  }

  onClearSelectedTeam(): void {
    this.selectedTeam.set(null);
  }

  onCloseToast(): void {
    this.teamStore.clearNotification();
  }
}

