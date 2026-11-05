import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pokemon-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="search-input"
          placeholder="Search Pokémon by name..."
          [ngModel]="searchTerm()"
          (ngModelChange)="searchChange.emit($event)"
          aria-label="Search Pokémon by name" />
        @if (searchTerm()) {
          <button
            type="button"
            class="clear-btn"
            aria-label="Clear search"
            (click)="searchChange.emit('')">
            ✕
          </button>
        }
      </div>

      <div class="type-filter">
        <label for="type-select" class="sr-only">Filter by type</label>
        <select
          id="type-select"
          class="type-select"
          [ngModel]="selectedType()"
          (ngModelChange)="typeChange.emit($event)">
          <option value="">All Types</option>
          @for (type of availableTypes(); track type) {
            <option [value]="type">{{ type | titlecase }}</option>
          }
        </select>
      </div>

      @if (searchTerm() || selectedType()) {
        <button
          type="button"
          class="reset-filters-btn"
          (click)="resetFilters.emit()">
          Reset Filters
        </button>
      }
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      font-size: 0.95rem;
      color: #94a3b8;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 10px 38px 10px 40px;
      font-size: 0.95rem;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #ffffff;
      color: #0f172a;
      transition: all 0.2s ease;
      outline: none;
    }
    .search-input:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
    .clear-btn {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 4px;
    }
    .clear-btn:hover {
      color: #0f172a;
    }
    .type-filter {
      min-width: 180px;
    }
    .type-select {
      width: 100%;
      padding: 10px 14px;
      font-size: 0.95rem;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #ffffff;
      color: #0f172a;
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .type-select:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
    .reset-filters-btn {
      padding: 10px 18px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .reset-filters-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class PokemonFilterComponent {
  public readonly searchTerm = input<string>('');
  public readonly selectedType = input<string>('');
  public readonly availableTypes = input<string[]>([]);

  public readonly searchChange = output<string>();
  public readonly typeChange = output<string>();
  public readonly resetFilters = output<void>();
}

