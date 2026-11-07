import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon, SortField, SortOrder } from '../../models/pokemon.model';
import { PaginationInfo } from '../../state/pokemon.selectors';
import { TypeColorPipe } from '../../../shared/pipes/type-color.pipe';

@Component({
  selector: 'app-pokemon-table',
  standalone: true,
  imports: [CommonModule, TypeColorPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <div class="table-responsive">
        <table class="pokemon-table">
          <thead>
            <tr>
              <th class="th-sprite">Sprite</th>
              <th class="th-name sortable" (click)="sort.emit('name')" title="Sort by Name">
                Name
                @if (sortField() === 'name') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
              <th class="th-types">Types</th>
              <th class="th-stat sortable" (click)="sort.emit('hp')" title="Sort by HP">
                HP
                @if (sortField() === 'hp') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
              <th class="th-stat sortable" (click)="sort.emit('attack')" title="Sort by Attack">
                Attack
                @if (sortField() === 'attack') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
              <th class="th-stat sortable" (click)="sort.emit('defense')" title="Sort by Defense">
                Defense
                @if (sortField() === 'defense') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
              <th class="th-stat sortable" (click)="sort.emit('specialAttack')" title="Sort by Special Attack">
                Special Attack
                @if (sortField() === 'specialAttack') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
              <th class="th-stat sortable" (click)="sort.emit('specialDefense')" title="Sort by Special Defense">
                Special Defense
                @if (sortField() === 'specialDefense') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
              <th class="th-stat sortable" (click)="sort.emit('speed')" title="Sort by Speed">
                Speed
                @if (sortField() === 'speed') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
              <th class="th-stat th-total sortable" (click)="sort.emit('total')" title="Sort by Total Base Stats">
                Total Base Stats
                @if (sortField() === 'total') {
                  <span class="sort-icon">{{ sortOrder() === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (row of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track row) {
                <tr class="skeleton-row">
                  <td><div class="skeleton-cell circle"></div></td>
                  <td><div class="skeleton-cell w-80"></div></td>
                  <td><div class="skeleton-cell w-60"></div></td>
                  <td><div class="skeleton-cell w-30"></div></td>
                  <td><div class="skeleton-cell w-30"></div></td>
                  <td><div class="skeleton-cell w-30"></div></td>
                  <td><div class="skeleton-cell w-30"></div></td>
                  <td><div class="skeleton-cell w-30"></div></td>
                  <td><div class="skeleton-cell w-30"></div></td>
                  <td><div class="skeleton-cell w-40"></div></td>
                </tr>
              }
            } @else if (pokemons().length === 0) {
              <tr>
                <td colspan="10" class="no-data-cell">
                  <div class="no-data-state">
                    <span class="no-data-icon">🔍</span>
                    <p class="no-data-title">No Pokémon found</p>
                    <p class="no-data-desc">
                      @if (hasActiveFilters()) {
                        No Pokémon match your search or filter criteria.
                      } @else {
                        No Pokémon data available right now.
                      }
                    </p>
                    @if (hasActiveFilters()) {
                      <button
                        type="button"
                        class="clear-filters-btn"
                        (click)="clearFilters.emit()">
                        Clear Active Filters
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @else {
              @for (p of pokemons(); track p.id) {
                <tr
                  class="pokemon-row"
                  [class.selected]="selectedId() === p.id"
                  (click)="selectPokemon.emit(p.id)">
                  <td class="td-sprite">
                    <img
                      [src]="p.sprite"
                      [alt]="p.name"
                      class="sprite-img"
                      loading="lazy" />
                  </td>
                  <td class="td-name">
                    <div class="name-container">
                      <span class="name-text">{{ p.name | titlecase }}</span>
                      <span class="dex-num">#{{ p.id.toString().padStart(3, '0') }}</span>
                    </div>
                  </td>
                  <td class="td-types">
                    <div class="type-badges-wrapper">
                      @for (type of p.types; track type) {
                        @let color = type | typeColor;
                        <span
                          class="type-tag"
                          [style.backgroundColor]="color.bg"
                          [style.color]="color.text">
                          {{ type | uppercase }}
                        </span>
                      }
                    </div>
                  </td>
                  <td class="td-stat">{{ p.stats.hp }}</td>
                  <td class="td-stat">{{ p.stats.attack }}</td>
                  <td class="td-stat">{{ p.stats.defense }}</td>
                  <td class="td-stat">{{ p.stats.specialAttack }}</td>
                  <td class="td-stat">{{ p.stats.specialDefense }}</td>
                  <td class="td-stat">{{ p.stats.speed }}</td>
                  <td class="td-stat td-total">
                    <span class="total-badge">{{ p.stats.total }}</span>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <footer class="pagination-footer">
        <div class="page-size-selector">
          <label for="page-size">Items per page:</label>
          <select
            id="page-size"
            class="page-size-select"
            [value]="pagination().pageSize"
            (change)="onPageSizeChange($event)">
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
          </select>
        </div>

        <div class="page-info">
          Showing {{ pagination().startIndex }} - {{ pagination().endIndex }} of {{ pagination().totalCount }}
        </div>

        <div class="page-navigation">
          <button
            type="button"
            class="page-btn"
            [disabled]="pagination().currentPage <= 1 || loading()"
            (click)="pageChange.emit(pagination().currentPage - 1)">
            ◀ Prev
          </button>
          <span class="page-current">Page {{ pagination().currentPage }} of {{ pagination().totalPages }}</span>
          <button
            type="button"
            class="page-btn"
            [disabled]="pagination().currentPage >= pagination().totalPages || loading()"
            (click)="pageChange.emit(pagination().currentPage + 1)">
            Next ▶
          </button>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .pokemon-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.92rem;
    }
    thead th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
      user-select: none;
    }
    th.sortable {
      cursor: pointer;
      transition: background 0.15s;
    }
    th.sortable:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .sort-icon {
      font-size: 0.7rem;
      margin-left: 4px;
      color: #ef4444;
    }
    tbody tr {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }
    tbody tr:hover {
      background: #f8fafc;
      cursor: pointer;
    }
    tbody tr.selected {
      background: #fee2e2;
    }
    td {
      padding: 12px 16px;
      vertical-align: middle;
      color: #334155;
    }
    .th-stat, .td-stat {
      text-align: right;
    }
    .th-total, .td-total {
      text-align: right;
    }
    .sprite-img {
      width: 44px;
      height: 44px;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .name-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .name-text {
      font-weight: 600;
      color: #0f172a;
    }
    .dex-num {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
    }
    .type-badges-wrapper {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .type-tag {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .total-badge {
      font-weight: 700;
      color: #1e293b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .no-data-cell {
      padding: 48px;
      text-align: center;
    }
    .no-data-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #64748b;
    }
    .no-data-icon {
      font-size: 2rem;
    }
    .clear-filters-btn {
      margin-top: 8px;
      padding: 8px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #0f172a;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .clear-filters-btn:hover {
      background: #e2e8f0;
    }
    .skeleton-cell {
      height: 18px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .skeleton-cell.circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .skeleton-cell.w-30 { width: 30px; }
    .skeleton-cell.w-40 { width: 40px; }
    .skeleton-cell.w-60 { width: 60px; }
    .skeleton-cell.w-80 { width: 80px; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .pagination-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 0.88rem;
      color: #64748b;
    }
    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-size-select {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #0f172a;
      outline: none;
    }
    .page-navigation {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-btn {
      padding: 6px 14px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #0f172a;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .page-btn:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .page-current {
      font-weight: 600;
      color: #334155;
    }
  `]
})
export class PokemonTableComponent {
  public readonly pokemons = input<Pokemon[]>([]);
  public readonly loading = input<boolean>(false);
  public readonly hasActiveFilters = input<boolean>(false);
  public readonly selectedId = input<number | null>(null);
  public readonly sortField = input<SortField>('id');
  public readonly sortOrder = input<SortOrder>('asc');
  public readonly pagination = input<PaginationInfo>({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    startIndex: 0,
    endIndex: 0
  });

  public readonly selectPokemon = output<number>();
  public readonly sort = output<SortField>();
  public readonly pageChange = output<number>();
  public readonly pageSizeChange = output<number>();
  public readonly clearFilters = output<void>();

  onPageSizeChange(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    this.pageSizeChange.emit(val);
  }
}

