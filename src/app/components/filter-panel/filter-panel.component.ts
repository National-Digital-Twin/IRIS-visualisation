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
  Floor,
  FloorInsulation,
  PostCode,
  Roof,
  RoofInsulation,
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
    { title: 'Post Code', data: PostCode },
    { title: 'Build Form', data: BuildForm },
  ];
  glazingFilters = [{ title: 'Multiple Glazing Type', data: WindowGlazing }];
  wallFilters = [
    { title: 'Wall Construction', data: Wall },
    { title: 'Wall Insulation', data: WallInsulation },
  ];
  floorFilters = [
    { title: 'Floor Construction', data: Floor },
    { title: 'Floor Insulation', data: FloorInsulation },
  ];
  roofFilters = [
    { title: 'Roof Construction', data: Roof },
    { title: 'Roof Insulation Location', data: RoofInsulation },
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
      buildingSize: [''],
      renewableEnergyFeatures: [false],
      multipleGlazingType: [''],
      mainFuelType: [''],
      mainHeatingCategory: [''],
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
    console.log('form submitted');
    console.log(this.advancedFiltersForm.value);
  }
}
