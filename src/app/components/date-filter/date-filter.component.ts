import { Component, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDatepickerModule,
  MatDatepicker,
  DateRange,
} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { DateFormModel } from '@core/models/advanced-filters.model';
import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';
import {
  ControlValueAccessor,
  FormsModule,
  ReactiveFormsModule,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { Subscription } from 'rxjs';

const moment = _rollupMoment || _moment;
export const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY',
  },
  display: {
    dateInput: 'YYYY',
    yearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    yearA11yLabel: 'YYYY',
  },
};

@Component({
  selector: 'c477-date-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFilterComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateFilterComponent),
      multi: true,
    },
  ],
  templateUrl: './date-filter.component.html',
  styleUrl: './date-filter.component.css',
})
export class DateFilterComponent implements ControlValueAccessor {
  range: boolean = false;
  dateForm: FormGroup;
  yearClick = 0;
  subscriptions: Subscription[] = [];

  get value(): DateFormModel {
    return this.dateForm.value;
  }

  set value(value: DateFormModel) {
    this.dateForm.setValue(value);
    this.onChange(value);
    this.onTouched();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (value: DateFormModel) => {};
  onTouched = () => {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: DateFormModel | null): void {
    if (value) {
      this.value = value;
    } else {
      this.dateForm.reset();
    }
  }

  validate(): object | null {
    return this.dateForm.valid ? null : { dateForm: { valid: false } };
  }

  constructor(private fb: FormBuilder) {
    this.dateForm = this.fb.group({
      singleYear: null,
      startYear: null,
      endYear: null,
    });

    this.subscriptions.push(
      this.dateForm.valueChanges.subscribe((value: DateFormModel) => {
        this.onChange(value);
        this.onTouched();
      })
    );
  }

  setYear(
    normalizedYear: Moment,
    datepicker: MatDatepicker<Moment> | MatDatepicker<DateRange<Moment>>
  ) {
    let selectedYear = 'singleYear';
    if (this.range) {
      if (this.yearClick === 0) {
        selectedYear = 'startYear';
        this.yearClick++;
      } else if (this.yearClick === 1) {
        selectedYear = 'endYear';
        this.yearClick = 0;
      }
    }
    const ctrlValue = this.dateForm.value[selectedYear] ?? moment();
    ctrlValue.year(normalizedYear.year());
    this.dateForm.controls[selectedYear].setValue(ctrlValue);

    datepicker.close();
  }
}
