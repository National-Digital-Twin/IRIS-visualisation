import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateFilterComponent } from '@components/date-filter/date-filter.component';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MultiButtonFilterComponent } from '@components/multi-button-filter/multi-button-filter.component';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import {
  BuildForm,
  DwellingSize,
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
  AdvancedFiltersFormModel,
  MultiButtonFilterOption,
} from '@core/models/advanced-filters.model';

import { FilterService } from '@core/services/filter.service';

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
  private filterService = inject(FilterService);
  filterProps = this.filterService.filters;

  advancedFiltersForm: FormGroup;
  generalFilters: MultiButtonFilterOption[] = [
    {
      title: 'Post Code',
      data: PostCode,
      formControlName: 'postCode',
      selectedValues: this.filterProps().PostCode,
    },
    {
      title: 'Build Form',
      data: BuildForm,
      formControlName: 'builtForm',
      selectedValues: this.filterProps().BuildForm,
    },
    {
      title: 'Dwelling Size',
      data: DwellingSize,
      formControlName: 'dwellingSize',
      selectedValues: this.filterProps().DwellingSize,
    },
  ];
  glazingFilters: MultiButtonFilterOption[] = [
    {
      title: 'Multiple Glazing Type',
      data: WindowGlazing,
      formControlName: 'multipleGlazingType',
      selectedValues: this.filterProps().WindowGlazing,
    },
  ];
  wallFilters: MultiButtonFilterOption[] = [
    {
      title: 'Wall Construction',
      data: Wall,
      formControlName: 'wallConstruction',
      selectedValues: this.filterProps().Wall,
    },
    {
      title: 'Wall Insulation',
      data: WallInsulation,
      formControlName: 'wallInsulation',
      selectedValues: this.filterProps().WallInsulation,
    },
  ];
  floorFilters: MultiButtonFilterOption[] = [
    {
      title: 'Floor Construction',
      data: Floor,
      formControlName: 'floorConstruction',
      selectedValues: this.filterProps().Floor,
    },
    {
      title: 'Floor Insulation',
      data: FloorInsulation,
      formControlName: 'floorInsulation',
      selectedValues: this.filterProps().FloorInsulation,
    },
  ];
  roofFilters: MultiButtonFilterOption[] = [
    {
      title: 'Roof Construction',
      data: Roof,
      formControlName: 'roofConstruction',
      selectedValues: this.filterProps().Roof,
    },
    {
      title: 'Roof Insulation Location',
      data: RoofInsulation,
      formControlName: 'roofInsulationLocation',
      selectedValues: this.filterProps().RoofInsulation,
    },
    {
      title: 'Roof Insulation Thickness',
      data: RoofInsulationThickness,
      formControlName: 'roofInsulationThickness',
      selectedValues: this.filterProps().RoofInsulationThickness,
    },
  ];
  otherPanels: PanelData[] = [
    { panelTitle: 'Glazing', filters: this.glazingFilters },
    { panelTitle: 'Wall', filters: this.wallFilters },
    { panelTitle: 'Floor', filters: this.floorFilters },
    { panelTitle: 'Roof', filters: this.roofFilters },
  ];

  constructor(private fb: FormBuilder) {
    this.advancedFiltersForm = this.fb.group<AdvancedFiltersFormModel>({
      postCode: [this.filterProps().PostCode as unknown as PostCode],
      builtForm: [this.filterProps().BuildForm as unknown as BuildForm],
      yearOfAssessment: null,
      dwellingSize: [
        this.filterProps().DwellingSize as unknown as DwellingSize,
      ],
      multipleGlazingType: [
        this.filterProps().WindowGlazing as unknown as WindowGlazing,
      ],
      wallConstruction: [this.filterProps().Wall as unknown as Wall],
      wallInsulation: [
        this.filterProps().WallInsulation as unknown as WallInsulation,
      ],
      floorConstruction: [this.filterProps().Floor as unknown as Floor],
      floorInsulation: [
        this.filterProps().FloorInsulation as unknown as FloorInsulation,
      ],
      roofConstruction: [this.filterProps().Roof as unknown as Roof],
      roofInsulationLocation: [
        this.filterProps().RoofInsulation as unknown as RoofInsulation,
      ],
      roofInsulationThickness: [
        this.filterProps()
          .RoofInsulationThickness as unknown as RoofInsulationThickness,
      ],
    });
  }

  onSubmit() {
    console.log(this.advancedFiltersForm.value);
  }
}
