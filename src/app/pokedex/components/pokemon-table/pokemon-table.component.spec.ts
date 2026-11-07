import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonTableComponent } from './pokemon-table.component';
import { Pokemon, SortField } from '../../models/pokemon.model';
import { PaginationInfo } from '../../state/pokemon.selectors';

describe('PokemonTableComponent (Table, Sort, Pagination & Detail Opening)', () => {
  let component: PokemonTableComponent;
  let fixture: ComponentFixture<PokemonTableComponent>;

  const mockPokemons: Pokemon[] = [
    {
      id: 1,
      name: 'bulbasaur',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      artwork: '',
      types: ['grass', 'poison'],
      stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
      abilities: [{ name: 'overgrow', isHidden: false }]
    },
    {
      id: 25,
      name: 'pikachu',
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      artwork: '',
      types: ['electric'],
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
      abilities: [{ name: 'static', isHidden: false }]
    }
  ];

  const mockPagination: PaginationInfo = {
    currentPage: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    startIndex: 1,
    endIndex: 2
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonTableComponent);
    component = fixture.componentInstance;
  });

  it('should render the required 10 table headers', () => {
    fixture.componentRef.setInput('pokemons', mockPokemons);
    fixture.componentRef.setInput('pagination', mockPagination);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const ths = compiled.querySelectorAll('thead th');
    expect(ths.length).toBe(10);

    const headers = Array.from(ths).map(th => th.textContent?.trim().replace(/[▲▼]/g, '').trim());
    expect(headers).toEqual([
      'Sprite',
      'Name',
      'Types',
      'HP',
      'Attack',
      'Defense',
      'Special Attack',
      'Special Defense',
      'Speed',
      'Total Base Stats'
    ]);
  });

  it('should render pokemon rows with sprite, name, types, six stats, and total', () => {
    fixture.componentRef.setInput('pokemons', mockPokemons);
    fixture.componentRef.setInput('pagination', mockPagination);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr.pokemon-row');
    expect(rows.length).toBe(2);

    const firstRowText = rows[0].textContent;
    expect(firstRowText).toContain('Bulbasaur');
    expect(firstRowText).toContain('#001');
    expect(firstRowText).toContain('GRASS');
    expect(firstRowText).toContain('POISON');
    expect(firstRowText).toContain('45'); // HP
    expect(firstRowText).toContain('49'); // Attack
    expect(firstRowText).toContain('318'); // Total
  });

  it('should emit sort output when a stat header is clicked', () => {
    fixture.componentRef.setInput('pokemons', mockPokemons);
    fixture.componentRef.setInput('pagination', mockPagination);
    fixture.detectChanges();

    let sortedField: SortField | null = null;
    component.sort.subscribe(field => {
      sortedField = field;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const hpHeader = compiled.querySelector('th[title="Sort by HP"]') as HTMLTableCellElement;
    expect(hpHeader).toBeTruthy();
    hpHeader.click();
    expect(sortedField).toBe('hp');

    const totalHeader = compiled.querySelector('th[title="Sort by Total Base Stats"]') as HTMLTableCellElement;
    expect(totalHeader).toBeTruthy();
    totalHeader.click();
    expect(sortedField).toBe('total');
  });

  it('should emit selectPokemon output when a row is clicked', () => {
    fixture.componentRef.setInput('pokemons', mockPokemons);
    fixture.componentRef.setInput('pagination', mockPagination);
    fixture.detectChanges();

    let selectedId: number | null = null;
    component.selectPokemon.subscribe(id => {
      selectedId = id;
    });

    const rows = fixture.nativeElement.querySelectorAll('tbody tr.pokemon-row');
    (rows[1] as HTMLTableRowElement).click();

    expect(selectedId).toBe(25);
  });

  it('should render loading skeleton when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('pokemons', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const skeletons = compiled.querySelectorAll('.skeleton-row');
    expect(skeletons.length).toBe(10);
  });

  it('should render empty state when no pokemons match search or filter', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('pokemons', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.no-data-cell')).toBeTruthy();
    expect(compiled.textContent).toContain('No Pokémon found');
  });

  it('should support pagination change and page size options (10, 25, 50)', () => {
    fixture.componentRef.setInput('pokemons', mockPokemons);
    fixture.componentRef.setInput('pagination', {
      ...mockPagination,
      totalPages: 3,
      totalCount: 30
    });
    fixture.detectChanges();

    let pageChangeVal: number | null = null;
    component.pageChange.subscribe(page => {
      pageChangeVal = page;
    });

    let pageSizeVal: number | null = null;
    component.pageSizeChange.subscribe(size => {
      pageSizeVal = size;
    });

    // Next page button
    const buttons = fixture.nativeElement.querySelectorAll('.page-btn');
    const nextBtn = buttons[1] as HTMLButtonElement;
    nextBtn.click();
    expect(pageChangeVal).toBe(2);

    // Page size dropdown
    const select = fixture.nativeElement.querySelector('#page-size') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[0].value).toBe('10');
    expect(select.options[1].value).toBe('25');
    expect(select.options[2].value).toBe('50');

    select.value = '25';
    select.dispatchEvent(new Event('change'));
    expect(pageSizeVal).toBe(25);
  });
});

