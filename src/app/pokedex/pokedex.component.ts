import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PokemonStore } from './state/pokemon.store';
import { PokemonSelectors } from './state/pokemon.selectors';
import { PokemonFilterComponent } from './components/pokemon-filter/pokemon-filter.component';
import { PokemonTableComponent } from './components/pokemon-table/pokemon-table.component';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { Pokemon, SortField } from './models/pokemon.model';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [
    CommonModule,
    PokemonFilterComponent,
    PokemonTableComponent,
    PokemonDetailComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pokedex-view">
      <section class="hero-header">
        <h1 class="hero-title">National Pokédex</h1>
        <p class="hero-subtitle">
          Search, filter, inspect base stats, and explore animated radar profiles.
        </p>
      </section>

      @if (error(); as err) {
        <div class="error-banner" role="alert">
          <span class="error-icon">⚠️</span>
          <span>{{ err }}</span>
          <button type="button" class="retry-btn" (click)="onRetry()">Retry</button>
        </div>
      }

      <app-pokemon-filter
        [searchTerm]="searchTerm()"
        [selectedType]="selectedType()"
        [availableTypes]="availableTypes()"
        (searchChange)="onSearchChange($event)"
        (typeChange)="onTypeChange($event)"
        (resetFilters)="onResetFilters()" />

      <app-pokemon-table
        [pokemons]="pokemons()"
        [loading]="loading()"
        [selectedId]="selectedPokemon()?.id ?? null"
        [sortField]="sortInfo().field"
        [sortOrder]="sortInfo().order"
        [pagination]="pagination()"
        (sort)="onSort($event)"
        (selectPokemon)="onSelectPokemon($event)"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)" />

      <app-pokemon-detail
        [isOpen]="isDetailOpen()"
        [pokemon]="selectedPokemon()"
        (closed)="onCloseDetail()" />
    </div>
  `,
  styles: [`
    .pokedex-view {
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
    .error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #b91c1c;
      font-size: 0.95rem;
      margin-bottom: 24px;
    }
    .retry-btn {
      margin-left: auto;
      padding: 6px 14px;
      background: #ef4444;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .retry-btn:hover {
      background: #dc2626;
    }
  `]
})
export class PokedexComponent {
  private readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);

  public readonly pokemons = toSignal(this.selectors.pokemons$, { initialValue: [] });
  public readonly loading = toSignal(this.selectors.loading$, { initialValue: false });
  public readonly error = toSignal(this.selectors.error$, { initialValue: null });
  public readonly searchTerm = toSignal(this.selectors.searchTerm$, { initialValue: '' });
  public readonly selectedType = toSignal(this.selectors.selectedType$, { initialValue: '' });
  public readonly availableTypes = toSignal(this.selectors.availableTypes$, { initialValue: [] });
  public readonly sortInfo = toSignal(this.selectors.sortInfo$, {
    initialValue: { field: 'id' as SortField, order: 'asc' as const }
  });
  public readonly pagination = toSignal(this.selectors.pagination$, {
    initialValue: {
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
      startIndex: 0,
      endIndex: 0
    }
  });

  public readonly selectedPokemon = signal<Pokemon | null>(null);
  public readonly isDetailOpen = signal<boolean>(false);

  constructor() {
    const storeSelected = toSignal(this.selectors.selectedPokemon$, { initialValue: null });
    effect(() => {
      const selected = storeSelected();
      if (selected) {
        this.selectedPokemon.set(selected);
        this.isDetailOpen.set(true);
      }
    });
  }

  onSearchChange(term: string): void {
    this.store.setSearchTerm(term);
  }

  onTypeChange(type: string): void {
    this.store.setSelectedType(type);
  }

  onResetFilters(): void {
    this.store.setSearchTerm('');
    this.store.setSelectedType('');
  }

  onSort(field: SortField): void {
    this.store.setSort(field);
  }

  onSelectPokemon(id: number): void {
    const found = this.pokemons().find(p => p.id === id) ?? null;
    this.selectedPokemon.set(found);
    this.isDetailOpen.set(true);
    this.store.selectPokemon(id);
  }

  onCloseDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedPokemon.set(null);
    this.store.selectPokemon(null);
  }

  onPageChange(page: number): void {
    this.store.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.store.setPageSize(size);
  }

  onRetry(): void {
    this.store.reload();
  }
}
