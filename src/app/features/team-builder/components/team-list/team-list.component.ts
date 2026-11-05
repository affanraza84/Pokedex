import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../../../core/models/team.model';
import { TypeColorPipe } from '../../../../shared/pipes/type-color.pipe';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, TypeColorPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="team-list-container">
      <div class="list-header">
        <h2 class="list-title">Saved Teams</h2>
        <span class="teams-count">{{ teams().length }} Teams</span>
      </div>

      @if (loading() && teams().length === 0) {
        <div class="loading-state">
          <span class="loading-spinner">⏳</span>
          <p>Loading your teams from GraphQL server...</p>
        </div>
      } @else if (teams().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🛡️</span>
          <p class="empty-title">No teams saved yet</p>
          <p class="empty-desc">Assemble your Pokémon team above and save it to the GraphQL database.</p>
        </div>
      } @else {
        <div class="teams-grid">
          @for (team of teams(); track team.id) {
            <div
              class="team-card"
              [class.optimistic-card]="team.isOptimistic"
              [class.selected-card]="selectedTeamId() === team.id"
              (click)="selectTeam.emit(team)">
              
              <div class="team-card-header">
                <div class="team-title-group">
                  <h3 class="team-name">{{ team.name }}</h3>
                  @if (team.isOptimistic) {
                    <span class="optimistic-badge" title="Syncing with GraphQL server...">
                      Syncing...
                    </span>
                  }
                </div>
                <button
                  type="button"
                  class="delete-btn"
                  aria-label="Delete team"
                  (click)="$event.stopPropagation(); deleteTeam.emit(team.id)">
                  🗑️
                </button>
              </div>

              <div class="team-members-list">
                @for (p of team.pokemons; track $index) {
                  <div class="member-badge" [title]="p.name | titlecase">
                    <img [src]="p.sprite" [alt]="p.name" class="member-sprite" />
                    <span class="member-name">{{ p.name | titlecase }}</span>
                    @if (p.types && p.types.length > 0) {
                      @let color = p.types[0] | typeColor;
                      <span
                        class="member-type-dot"
                        [style.backgroundColor]="color.bg"
                        [title]="p.types.join(', ')"></span>
                    }
                  </div>
                }
              </div>

              <div class="team-footer">
                <span class="member-count-text">{{ team.pokemons.length }} / 6 Pokémon</span>
                <span class="action-hint">Click to inspect team types →</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .team-list-container {
      width: 100%;
    }
    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .list-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .teams-count {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      background: #f1f5f9;
      color: #64748b;
    }
    .loading-state, .empty-state {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #64748b;
    }
    .empty-icon, .loading-spinner {
      font-size: 2.5rem;
    }
    .empty-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .empty-desc {
      font-size: 0.9rem;
      margin: 0;
      max-width: 360px;
    }
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .team-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.2s;
    }
    .team-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
    }
    .team-card.selected-card {
      border-color: #ef4444;
      background: #fffcfc;
    }
    .team-card.optimistic-card {
      opacity: 0.8;
      border-style: dashed;
      border-color: #3b82f6;
    }
    .team-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .team-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .team-name {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }
    .optimistic-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 9999px;
      border: 1px solid #bfdbfe;
    }
    .delete-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .delete-btn:hover {
      background: #fee2e2;
    }
    .team-members-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .member-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 4px 8px;
    }
    .member-sprite {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
    .member-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: #334155;
    }
    .member-type-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
    }
    .team-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }
    .action-hint {
      color: #ef4444;
      font-weight: 500;
    }
  `]
})
export class TeamListComponent {
  public readonly teams = input<Team[]>([]);
  public readonly loading = input<boolean>(false);
  public readonly selectedTeamId = input<string | null>(null);

  public readonly deleteTeam = output<string>();
  public readonly selectTeam = output<Team>();
}
