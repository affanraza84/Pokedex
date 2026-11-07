import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../models/pokemon.model';
import { TypeColorPipe } from '../../../shared/pipes/type-color.pipe';
import { StatRadarChartComponent } from '../stat-radar-chart/stat-radar-chart.component';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, TypeColorPipe, StatRadarChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen() && pokemon(); as p) {
      <div class="drawer-overlay" (click)="closed.emit()">
        <aside
          class="drawer-panel"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="p.name + ' Details'">
          
          <header class="drawer-header">
            <div class="title-group">
              <span class="pokedex-id">{{ formattedPokedexId() }}</span>
              <h2 class="pokemon-name">{{ p.name | titlecase }}</h2>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="closed.emit()"
              aria-label="Close detail panel">
              ✕
            </button>
          </header>

          <div class="drawer-body">
            <div class="artwork-card">
              <img
                [src]="p.artwork || p.sprite"
                [alt]="p.name"
                class="pokemon-art"
                (load)="onImageLoaded()"
                loading="lazy" />
              <div class="types-row">
                @for (type of p.types; track type) {
                  @let color = type | typeColor;
                  <span
                    class="type-pill"
                    [style.backgroundColor]="color.bg"
                    [style.color]="color.text">
                    {{ type | uppercase }}
                  </span>
                }
              </div>
            </div>

            <!-- Abilities Section -->
            <section class="abilities-section">
              <h3 class="section-title">Abilities</h3>
              <div class="abilities-list">
                @for (ability of p.abilities; track ability.name) {
                  <div class="ability-pill" [class.hidden-ability]="ability.isHidden">
                    <span class="ability-name">{{ ability.name.replace('-', ' ') | titlecase }}</span>
                    @if (ability.isHidden) {
                      <span class="hidden-label">Hidden</span>
                    }
                  </div>
                } @empty {
                  <span class="empty-ability-text">None documented</span>
                }
              </div>
            </section>

            <section class="chart-section">
              <h3 class="section-title">Base Stat Radar</h3>
              <app-stat-radar-chart
                [stats]="p.stats"
                [pokemonName]="p.name | titlecase" />
            </section>

            <section class="stat-list-section">
              <div class="stat-header-row">
                <h3 class="section-title">Stat Breakdown</h3>
                <span class="total-stat-pill">
                  Total Base Stats: <strong>{{ calculatedTotal() }}</strong>
                </span>
              </div>

              <div class="stat-bars">
                @for (stat of statBreakdown(); track stat.key) {
                  <div class="stat-bar-row">
                    <span class="stat-label">{{ stat.label }}</span>
                    <span class="stat-val">{{ stat.val }}</span>
                    <div class="progress-track">
                      <div
                        class="progress-fill"
                        [class]="stat.key"
                        [style.width.%]="stat.percent"></div>
                    </div>
                  </div>
                }
              </div>
            </section>
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease;
    }
    .drawer-panel {
      width: 100%;
      max-width: 460px;
      height: 100%;
      background: #ffffff;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .drawer-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      background: #ffffff;
      z-index: 10;
    }
    .title-group {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .pokedex-id {
      font-size: 1rem;
      font-weight: 700;
      color: #94a3b8;
    }
    .pokemon-name {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }
    .close-btn {
      background: #f1f5f9;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .close-btn:hover {
      background: #fee2e2;
      color: #ef4444;
    }
    .drawer-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    .artwork-card {
      background: radial-gradient(circle, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .pokemon-art {
      width: 180px;
      height: 180px;
      object-fit: contain;
      filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.15));
      transition: transform 0.3s ease;
    }
    .pokemon-art:hover {
      transform: scale(1.08);
    }
    .types-row {
      display: flex;
      gap: 8px;
    }
    .type-pill {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: 9999px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .section-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
      color: #1e293b;
    }
    .stat-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .total-stat-pill {
      background: #f1f5f9;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.85rem;
      color: #334155;
    }
    .total-stat-pill strong {
      color: #ef4444;
    }
    .abilities-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .abilities-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ability-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }
    .ability-pill.hidden-ability {
      background: #fdf4ff;
      border-color: #f0abfc;
      color: #86198f;
    }
    .hidden-label {
      font-size: 0.65rem;
      padding: 1px 6px;
      border-radius: 9999px;
      background: #fae8ff;
      color: #a21caf;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .empty-ability-text {
      color: #94a3b8;
      font-size: 0.85rem;
      font-style: italic;
    }
    .stat-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .stat-bar-row {
      display: grid;
      grid-template-columns: 80px 40px 1fr;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
    }
    .stat-label {
      color: #64748b;
      font-weight: 500;
    }
    .stat-val {
      font-weight: 700;
      color: #1e293b;
      text-align: right;
    }
    .progress-track {
      height: 8px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.6s ease;
    }
    .progress-fill.hp { background: #ff5959; }
    .progress-fill.attack { background: #f5ac78; }
    .progress-fill.defense { background: #fae078; }
    .progress-fill.specialAttack { background: #9db7f5; }
    .progress-fill.specialDefense { background: #a7db8d; }
    .progress-fill.speed { background: #fa92b2; }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class PokemonDetailComponent {
  // Angular Signal Inputs
  public readonly isOpen = input<boolean>(false);
  public readonly pokemon = input<Pokemon | null>(null);

  // Angular Signal Output
  public readonly closed = output<void>();

  // Local UI signal for image loading state
  public readonly isImageLoaded = signal<boolean>(false);

  /**
   * Requirement 2: Derived total base stats using Angular Signals computed().
   */
  public readonly calculatedTotal = computed<number>(() => {
    const p = this.pokemon();
    if (!p) return 0;
    const { hp, attack, defense, specialAttack, specialDefense, speed } = p.stats;
    return hp + attack + defense + specialAttack + specialDefense + speed;
  });

  /**
   * Derived formatted national Dex ID (e.g. #001).
   */
  public readonly formattedPokedexId = computed<string>(() => {
    const p = this.pokemon();
    return p ? `#${p.id.toString().padStart(3, '0')}` : '#000';
  });

  /**
   * Derived 6-stat breakdown with normalized percentages for progress bars using computed().
   */
  public readonly statBreakdown = computed(() => {
    const p = this.pokemon();
    if (!p) return [];
    return [
      { key: 'hp', label: 'HP', val: p.stats.hp, percent: Math.min(100, Math.round((p.stats.hp / 255) * 100)) },
      { key: 'attack', label: 'Attack', val: p.stats.attack, percent: Math.min(100, Math.round((p.stats.attack / 255) * 100)) },
      { key: 'defense', label: 'Defense', val: p.stats.defense, percent: Math.min(100, Math.round((p.stats.defense / 255) * 100)) },
      { key: 'specialAttack', label: 'Sp. Atk', val: p.stats.specialAttack, percent: Math.min(100, Math.round((p.stats.specialAttack / 255) * 100)) },
      { key: 'specialDefense', label: 'Sp. Def', val: p.stats.specialDefense, percent: Math.min(100, Math.round((p.stats.specialDefense / 255) * 100)) },
      { key: 'speed', label: 'Speed', val: p.stats.speed, percent: Math.min(100, Math.round((p.stats.speed / 255) * 100)) }
    ];
  });

  onImageLoaded(): void {
    this.isImageLoaded.set(true);
  }
}

