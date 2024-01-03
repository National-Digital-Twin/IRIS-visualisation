import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import { FilterPanelComponent } from '@containers/filter-panel/filter-panel.component';
import { LabelComponent } from '@components/label/label.component';

import {
  BuildForm,
  DwellingSize,
  EPCRating,
  Floor,
  FloorInsulation,
  PostCode,
  PropertyType,
  Roof,
  RoofInsulation,
  RoofInsulationThickness,
  Wall,
  WallInsulation,
  WindowGlazing,
} from '@core/enums';
import {
  AdvancedFiltersFormModel,
  FilterProps,
} from '@core/models/advanced-filters.model';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
export class MainFiltersComponent {
  @Input() filterProps?: FilterProps;
  @Output() setRouteParams: EventEmitter<{ [key: string]: string[] }> =
    new EventEmitter<{ [key: string]: string[] }>();
  @Output() setAdvancedFilters: EventEmitter<AdvancedFiltersFormModel> =
    new EventEmitter<AdvancedFiltersFormModel>();

  constructor(public dialog: MatDialog) {}
  private fb: FormBuilder = inject(FormBuilder);
  epcRatings: { [key: string]: string } = EPCRating;
  propertyTypes: { [key: string]: string } = PropertyType;

  advancedFiltersForm?: FormGroup;

  getKeys(options: { [key: string]: string }) {
    return Object.keys(options);
  }

  openAdvancedFilters() {
    const dialogRef = this.dialog.open(FilterPanelComponent, {
      panelClass: 'filter-panel',
      data: {
        filterProps: this.filterProps,
        form: this.createForm(),
      },
    });
    dialogRef.afterClosed().subscribe(form => {
      if (form.value) {
        this.setAdvancedFilters.emit(form.value);
      }
    });
  }

  propertyTypeChange(e: MatSelectChange) {
    this.setRouteParams.emit({ PropertyType: e.value });
  }

  ratingChange(e: MatSelectChange) {
    this.setRouteParams.emit({ EPC: e.value.map((r: string) => r.slice(-1)) });
  }

  createForm(): FormGroup {
    this.advancedFiltersForm = this.fb.group<AdvancedFiltersFormModel>({
      PostCode: [this.filterProps?.PostCode as unknown as PostCode],
      BuildForm: [this.filterProps?.BuildForm as unknown as BuildForm],
      YearOfAssessment: null,
      DwellingSize: [this.filterProps?.DwellingSize as unknown as DwellingSize],
      MultipleGlazingType: [
        this.filterProps?.MultipleGlazingType as unknown as WindowGlazing,
      ],
      WallConstruction: [this.filterProps?.WallConstruction as unknown as Wall],
      WallInsulation: [
        this.filterProps?.WallInsulation as unknown as WallInsulation,
      ],
      FloorConstruction: [
        this.filterProps?.FloorConstruction as unknown as Floor,
      ],
      FloorInsulation: [
        this.filterProps?.FloorInsulation as unknown as FloorInsulation,
      ],
      RoofConstruction: [this.filterProps?.RoofConstruction as unknown as Roof],
      RoofInsulationLocation: [
        this.filterProps?.RoofInsulationLocation as unknown as RoofInsulation,
      ],
      RoofInsulationThickness: [
        this.filterProps
          ?.RoofInsulationThickness as unknown as RoofInsulationThickness,
      ],
    });
    return this.advancedFiltersForm;
  }
}
