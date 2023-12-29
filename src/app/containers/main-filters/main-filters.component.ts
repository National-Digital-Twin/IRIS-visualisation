import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import { FilterPanelComponent } from '@containers/filter-panel/filter-panel.component';
import { LabelComponent } from '@components/label/label.component';

import { EPCRating, PropertyType } from '@core/enums';
import { FilterProps } from '@core/models/advanced-filters.model';

@Component({
  selector: 'c477-main-filters',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './main-filters.component.html',
  styleUrl: './main-filters.component.css',
})
export class MainFiltersComponent {
  @Input() filterProps?: FilterProps;
  @Output() setRouteParams: EventEmitter<{ [key: string]: string[] }> =
    new EventEmitter<{ [key: string]: string[] }>();

  epcRatings: { [key: string]: string } = EPCRating;
  propertyTypes: { [key: string]: string } = PropertyType;

  constructor(public dialog: MatDialog) {}

  getKeys(options: { [key: string]: string }) {
    return Object.keys(options);
  }

  openAdvancedFilters() {
    this.dialog.open(FilterPanelComponent, {
      panelClass: 'filter-panel',
      data: {
        filterProps: this.filterProps,
      },
    });
  }

  propertyTypeChange(e: MatSelectChange) {
    this.setRouteParams.emit({ PropertyType: e.value });
  }

  ratingChange(e: MatSelectChange) {
    this.setRouteParams.emit({ EPC: e.value.map((r: string) => r.slice(-1)) });
  }
}
