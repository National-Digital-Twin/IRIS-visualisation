import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '@components/label/label.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DataService } from '@core/services/data.service';
import { EPCRating, PropertyType } from '@core/enums';
import { FilterPanelComponent } from '@components/filter-panel/filter-panel.component';
import { MainFiltersFormModel } from '@core/models/filters.model';

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
    ReactiveFormsModule,
  ],
  templateUrl: './main-filters.component.html',
  styleUrl: './main-filters.component.css',
})
export class MainFiltersComponent implements OnDestroy {
  epcRatings: { [key: string]: string } = EPCRating;
  buildingTypes: { [key: string]: string } = PropertyType;
  mainFiltersForm: FormGroup;
  subscriptions: Subscription[] = [];

  private dataService = inject(DataService);

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.mainFiltersForm = this.fb.group<MainFiltersFormModel>({
      epc: null,
      propertyType: null,
    });

    this.subscriptions.push(
      // any time the inner form changes update the parent
      this.mainFiltersForm.valueChanges.subscribe(
        (value: MainFiltersFormModel) => {
          this.dataService.setFilters(value);
        }
      )
    );
  }

  getKeys(options: { [key: string]: string }) {
    return Object.keys(options);
  }

  openAdvancedFilters() {
    this.dialog.open(FilterPanelComponent, {
      panelClass: 'filter-panel',
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
