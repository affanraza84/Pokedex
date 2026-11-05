import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pokemon } from '../../../../core/models/pokemon.model';
import { TypeColorPipe } from '../../../../shared/pipes/type-color.pipe';

@Component({
  selector: 'app-pokemon-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, TypeColorPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="autocomplete-container">
      <div class="input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="autocomplete-input"
          [disabled]="disabled()"
          [placeholder]="disabled() ? 'Team is full (max 6 Pokémon)' : 'Search Pokémon to add to team...'"
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
          (focus)="isOpen.set(true)"
          aria-label="Search Pokémon to add to team" />
        @if (query()) {
          <button
            type="button"
            class="clear-btn"
            (click)="clearQuery()">
            ✕
          </button>
        }
      </div>

      @if (isOpen() && filteredPokemons().length > 0 && !disabled()) {
        <div class="dropdown-menu" role="listbox">
          @for (p of filteredPokemons(); track p.id) {
            <div
              class="dropdown-item"
              role="option"
              [attr.aria-selected]="false"
              (click)="onSelect(p)">
              <img [src]="p.sprite" [alt]="p.name" class="item-sprite" loading="lazy" />
              <div class="item-info">
                <span class="item-name">{{ p.name | titlecase }}</span>
                <span class="item-id">#{{ p.id.toString().padStart(3, '0') }}</span>
              </div>
              <div class="item-types">
                @for (type of p.types; track type) {
                  @let color = type | typeColor;
                  <span
                    class="mini-type-badge"
                    [style.backgroundColor]="color.bg"
                    [style.color]="color.text">
                    {{ type | uppercase }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .autocomplete-container {
      position: relative;
      width: 100%;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
      pointer-events: none;
    }
    .autocomplete-input {
      width: 100%;
      padding: 12px 40px 12px 42px;
      font-size: 0.95rem;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #ffffff;
      color: #0f172a;
      outline: none;
      transition: all 0.2s;
    }
    .autocomplete-input:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
    .autocomplete-input:disabled {
      background: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
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
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
      max-height: 280px;
      overflow-y: auto;
      z-index: 50;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #f1f5f9;
    }
    .dropdown-item:last-child {
      border-bottom: none;
    }
    .dropdown-item:hover {
      background: #f8fafc;
    }
    .item-sprite {
      width: 38px;
      height: 38px;
      object-fit: contain;
    }
    .item-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .item-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.95rem;
    }
    .item-id {
      font-size: 0.78rem;
      color: #94a3b8;
    }
    .item-types {
      display: flex;
      gap: 4px;
    }
    .mini-type-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
  `]
})
export class PokemonAutocompleteComponent {
  public readonly availablePokemons = input<Pokemon[]>([]);
  public readonly disabled = input<boolean>(false);

  public readonly selectPokemon = output<Pokemon>();

  public readonly query = signal<string>('');
  public readonly isOpen = signal<boolean>(false);

  public readonly filteredPokemons = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.availablePokemons();
    if (!q) return list.slice(0, 8);
    return list.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  });

  onQueryChange(value: string): void {
    this.query.set(value);
    this.isOpen.set(true);
  }

  onSelect(p: Pokemon): void {
    this.selectPokemon.emit(p);
    this.clearQuery();
  }

  clearQuery(): void {
    this.query.set('');
    this.isOpen.set(false);
  }
}
