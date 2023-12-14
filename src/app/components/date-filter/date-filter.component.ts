import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDatepickerModule,
  MatDatepicker,
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
import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';

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
  ],
  templateUrl: './date-filter.component.html',
  styleUrl: './date-filter.component.css',
})
export class DateFilterComponent {
  singleYear = new FormControl(moment());
  startYear = new FormControl(moment());
  endYear = new FormControl(moment());
  range: boolean = false;

  setStartYear(normalizedYear: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.startYear.value ?? moment();
    ctrlValue.year(normalizedYear.year());
    this.startYear.setValue(ctrlValue);
    if (!this.range) {
      datepicker.close();
    }
  }

  setEndYear(normalizedYear: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.endYear.value ?? null;
    if (ctrlValue) {
      ctrlValue.year(normalizedYear.year());
    }
    this.endYear.setValue(ctrlValue);
    datepicker.close();
  }
}
