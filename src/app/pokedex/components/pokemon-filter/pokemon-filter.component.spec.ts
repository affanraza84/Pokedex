import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PokemonFilterComponent } from './pokemon-filter.component';

describe('PokemonFilterComponent (Search & Type Filter UI)', () => {
  let component: PokemonFilterComponent;
  let fixture: ComponentFixture<PokemonFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonFilterComponent);
    component = fixture.componentInstance;
  });

  it('should emit searchChange output when search input value changes', () => {
    let emittedSearch = '';
    component.searchChange.subscribe(val => {
      emittedSearch = val;
    });

    fixture.componentRef.setInput('searchTerm', '');
    fixture.componentRef.setInput('availableTypes', ['fire', 'water', 'grass']);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;
    input.value = 'char';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(emittedSearch).toBe('char');
  });

  it('should emit typeChange output when type select changes', () => {
    let emittedType = '';
    component.typeChange.subscribe(type => {
      emittedType = type;
    });

    fixture.componentRef.setInput('availableTypes', ['fire', 'water', 'grass']);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('.type-select') as HTMLSelectElement;
    select.value = 'fire';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emittedType).toBe('fire');
  });

  it('should show reset button when search or type filter is active and emit resetFilters', () => {
    let resetClicked = false;
    component.resetFilters.subscribe(() => {
      resetClicked = true;
    });

    fixture.componentRef.setInput('searchTerm', 'pika');
    fixture.componentRef.setInput('selectedType', 'electric');
    fixture.componentRef.setInput('availableTypes', ['electric']);
    fixture.detectChanges();

    const resetBtn = fixture.nativeElement.querySelector('.reset-filters-btn') as HTMLButtonElement;
    expect(resetBtn).toBeTruthy();
    resetBtn.click();

    expect(resetClicked).toBe(true);
  });
});

