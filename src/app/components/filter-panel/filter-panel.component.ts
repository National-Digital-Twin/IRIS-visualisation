import { Component } from '@angular/core';
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
  generalFilters = [
    { title: 'Post Code', data: PostCode, formControlName: 'postCode' },
    { title: 'Build Form', data: BuildForm, formControlName: 'builtForm' },
    {
      title: 'Dwelling Size',
      data: DwellingSize,
      formControlName: 'dwellingSize',
    },
  ];
  glazingFilters = [
    {
      title: 'Multiple Glazing Type',
      data: WindowGlazing,
      formControlName: 'multipleGlazingType',
    },
  ];
  wallFilters = [
    {
      title: 'Wall Construction',
      data: Wall,
      formControlName: 'wallConstruction',
    },
    {
      title: 'Wall Insulation',
      data: WallInsulation,
      formControlName: 'wallInsulation',
    },
  ];
  floorFilters = [
    {
      title: 'Floor Construction',
      data: Floor,
      formControlName: 'floorConstruction',
    },
    {
      title: 'Floor Insulation',
      data: FloorInsulation,
      formControlName: 'floorInsulation',
    },
  ];
  roofFilters = [
    {
      title: 'Roof Construction',
      data: Roof,
      formControlName: 'roofConstruction',
    },
    {
      title: 'Roof Insulation Location',
      data: RoofInsulation,
      formControlName: 'roofInsulationLocation',
    },
    {
      title: 'Roof Insulation Thickness',
      data: RoofInsulationThickness,
      formControlName: 'roofInsulationThickness',
    },
  ];
  otherPanels = [
    { panelTitle: 'Glazing', filters: this.glazingFilters },
    { panelTitle: 'Wall', filters: this.wallFilters },
    { panelTitle: 'Floor', filters: this.floorFilters },
    { panelTitle: 'Roof', filters: this.roofFilters },
  ];

  constructor(private fb: FormBuilder) {
    this.advancedFiltersForm = this.fb.group({
      postCode: [''],
      builtForm: [''],
      yearOfAssessment: [''],
      dwellingSize: [''],
      multipleGlazingType: [''],
      wallConstruction: [''],
      wallInsulation: [''],
      floorConstruction: [''],
      floorInsulation: [''],
      roofConstruction: [''],
      roofInsulationLocation: [''],
      roofInsulationThickness: [''],
    });
  }

  onSubmit() {
    console.log(this.advancedFiltersForm.value);
  }
}
