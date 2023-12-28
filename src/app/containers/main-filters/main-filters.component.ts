import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import { FilterPanelComponent } from '@containers/filter-panel/filter-panel.component';
import { LabelComponent } from '@components/label/label.component';

import { FilterService } from '@core/services/filter.service';

import { EPCRating, PropertyType } from '@core/enums';

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
  private filterService = inject(FilterService);

  filterProps = this.filterService.filters;

  epcRatings: { [key: string]: string } = EPCRating;
  propertyTypes: { [key: string]: string } = PropertyType;

  constructor(public dialog: MatDialog) {}

  getKeys(options: { [key: string]: string }) {
    return Object.keys(options);
  }

  openAdvancedFilters() {
    this.dialog.open(FilterPanelComponent, {
      panelClass: 'filter-panel',
    });
  }

  propertyTypeChange(e: MatSelectChange) {
    console.log(e);
  }

  ratingChange(e: MatSelectChange) {
    console.log(e);
  }
}
