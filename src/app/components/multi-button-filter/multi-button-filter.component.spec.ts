import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiButtonFilterComponent } from './multi-button-filter.component';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { AdvancedFilter } from '@core/models/advanced-filters.model';

describe('MultiButtonFilterComponent', () => {
  let component: MultiButtonFilterComponent<AdvancedFilter>;
  let fixture: ComponentFixture<MultiButtonFilterComponent<AdvancedFilter>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiButtonFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiButtonFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ControlValueAccessor implementation', () => {
    it('should set selectedValues via writeValue when non-null value is provided', () => {
      const value = ['option1', 'option2'];
      component.writeValue(value as unknown as AdvancedFilter[]);
      expect(component.selectedValues).toEqual(value);
    });

    it('should set selectedValues to empty array when writeValue is called with null', () => {
      component.writeValue(null);
      expect(component.selectedValues).toEqual([]);
    });

    it('should register onChange function via registerOnChange', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);
      expect(component.hasChange).toBe(fn);
    });

    it('should register onTouched function via registerOnTouched', () => {
      const fn = jest.fn();
      component.registerOnTouched(fn);
      expect(component.isTouched).toBe(fn);
    });
  });

  describe('filterChange', () => {
    it('should call isTouched and then hasChange with the event value', () => {
      component.isTouched = jest.fn();
      component.hasChange = jest.fn();

      const event = { value: ['optionA', 'optionB'] } as MatButtonToggleChange;
      component.filterChange(event);

      expect(component.isTouched).toHaveBeenCalled();
      expect(component.selectedValues).toEqual(['optionA', 'optionB']);
      expect(component.hasChange).toHaveBeenCalledWith(['optionA', 'optionB']);
    });
  });
});
