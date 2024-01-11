import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateFilterComponent } from '@components/date-filter/date-filter.component';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MultiButtonFilterComponent } from '@components/multi-button-filter/multi-button-filter.component';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import {
  BuildForm,
  Floor,
  FloorInsulation,
  PostCode,
  Roof,
  RoofInsulation,
  RoofInsulationThickness,
  WindowGlazing,
  Wall,
  WallInsulation,
} from '@core/enums';
import {
  FilterProps,
  MultiButtonFilterOption,
} from '@core/models/advanced-filters.model';

interface PanelData {
  panelTitle: string;
  filters: MultiButtonFilterOption[];
}

@Component({
  selector: 'c477-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    DateFilterComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatExpansionModule,
    MultiButtonFilterComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent {
  advancedFiltersForm: FormGroup;
  generalFilters: MultiButtonFilterOption[] = [
    {
      title: 'Post Code',
      data: PostCode,
      formControlName: 'PostCode',
      selectedValues: this.data.filterProps?.PostCode,
    },
    {
      title: 'Build Form',
      data: BuildForm,
      formControlName: 'BuildForm',
      selectedValues: this.data.filterProps?.BuildForm,
    },
  ];
  glazingFilters: MultiButtonFilterOption[] = [
    {
      title: 'Multiple Glazing Type',
      data: WindowGlazing,
      formControlName: 'MultipleGlazingType',
      selectedValues: this.data.filterProps?.MultipleGlazingType,
    },
  ];
  wallFilters: MultiButtonFilterOption[] = [
    {
      title: 'Wall Construction',
      data: Wall,
      formControlName: 'WallConstruction',
      selectedValues: this.data.filterProps?.WallConstruction,
    },
    {
      title: 'Wall Insulation',
      data: WallInsulation,
      formControlName: 'WallInsulation',
      selectedValues: this.data.filterProps?.WallInsulation,
    },
  ];
  floorFilters: MultiButtonFilterOption[] = [
    {
      title: 'Floor Construction',
      data: Floor,
      formControlName: 'FloorConstruction',
      selectedValues: this.data.filterProps?.FloorConstruction,
    },
    {
      title: 'Floor Insulation',
      data: FloorInsulation,
      formControlName: 'FloorInsulation',
      selectedValues: this.data.filterProps?.FloorInsulation,
    },
  ];
  roofFilters: MultiButtonFilterOption[] = [
    {
      title: 'Roof Construction',
      data: Roof,
      formControlName: 'RoofConstruction',
      selectedValues: this.data.filterProps?.RoofConstruction,
    },
    {
      title: 'Roof Insulation Location',
      data: RoofInsulation,
      formControlName: 'RoofInsulationLocation',
      selectedValues: this.data.filterProps?.RoofInsulationLocation,
    },
    {
      title: 'Roof Insulation Thickness',
      data: RoofInsulationThickness,
      formControlName: 'RoofInsulationThickness',
      selectedValues: this.data.filterProps?.RoofInsulationThickness,
    },
  ];
  otherPanels: PanelData[] = [
    { panelTitle: 'Glazing', filters: this.glazingFilters },
    { panelTitle: 'Wall', filters: this.wallFilters },
    { panelTitle: 'Floor', filters: this.floorFilters },
    { panelTitle: 'Roof', filters: this.roofFilters },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      filterProps?: FilterProps;
      form: FormGroup;
    }
  ) {
    this.advancedFiltersForm = this.data.form;
  }
}
