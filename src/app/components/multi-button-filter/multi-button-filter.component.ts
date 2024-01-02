import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import {
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
} from '@angular/forms';

import { AdvancedFilter } from '@core/models/advanced-filters.model';

type MultiFilterControlValue<T extends AdvancedFilter> = T[] | null;

@Component({
  selector: 'c477-multi-button-filter[title][options]',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiButtonFilterComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MultiButtonFilterComponent),
      multi: true,
    },
  ],
  templateUrl: './multi-button-filter.component.html',
  styleUrl: './multi-button-filter.component.css',
})
export class MultiButtonFilterComponent<T extends AdvancedFilter>
  implements OnInit, ControlValueAccessor
{
  @Input() title!: string;
  @Input() options!: {
    [key: string]: string;
  };
  optionKeys: string[] = [];
  selectedValues?: string[];
  touched = false;

  ngOnInit(): void {
    this.optionKeys = Object.keys(this.options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (selectedValues: MultiFilterControlValue<T>) => {};

  onTouched = () => {};

  writeValue(value: MultiFilterControlValue<T> | null) {
    if (value) {
      this.selectedValues = value as unknown as string[];
    } else {
      this.selectedValues = [];
    }
  }

  registerOnChange(onChange: (value: MultiFilterControlValue<T>) => void) {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void) {
    this.onTouched = onTouched;
  }

  validate(): boolean | null {
    return true;
  }

  filterChange(e: MatButtonToggleChange) {
    this.markAsTouched();
    this.selectedValues = e.value;
    this.onChange(this.selectedValues as unknown as MultiFilterControlValue<T>);
  }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }
}
