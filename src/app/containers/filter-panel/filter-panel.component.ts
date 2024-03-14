import { Component, Inject, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MultiButtonFilterComponent } from '@components/multi-button-filter/multi-button-filter.component';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import {
  FilterProps,
  MultiButtonFilterOption,
} from '@core/models/advanced-filters.model';
import { Subject, takeUntil } from 'rxjs';
import { UtilService } from '@core/services/utils.service';

interface PanelData {
  panelTitle: string;
  filters: MultiButtonFilterOption[];
}

@Component({
  selector: 'c477-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
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
export class FilterPanelComponent implements OnDestroy {
  private utilService = inject(UtilService);
  advancedFiltersForm: FormGroup;
  generalFilters: MultiButtonFilterOption[] = [
    {
      title: 'Post Code',
      data: [],
      formControlName: 'PostCode',
      selectedValues: this.data.filterProps?.PostCode,
    },
    {
      title: 'Build Form',
      data: [],
      formControlName: 'BuildForm',
      selectedValues: this.data.filterProps?.BuildForm,
    },
    {
      title: 'Year of Inspection',
      data: [],
      formControlName: 'YearOfAssessment',
      selectedValues: this.data.filterProps?.YearOfAssessment,
    },
  ];
  glazingFilters: MultiButtonFilterOption[] = [
    {
      title: 'Multiple Glazing Type',
      data: [],
      formControlName: 'WindowGlazing',
      selectedValues: this.data.filterProps?.WindowGlazing,
    },
  ];
  wallFilters: MultiButtonFilterOption[] = [
    {
      title: 'Wall Construction',
      data: [],
      formControlName: 'WallConstruction',
      selectedValues: this.data.filterProps?.WallConstruction,
    },
    {
      title: 'Wall Insulation',
      data: [],
      formControlName: 'WallInsulation',
      selectedValues: this.data.filterProps?.WallInsulation,
    },
  ];
  floorFilters: MultiButtonFilterOption[] = [
    {
      title: 'Floor Construction',
      data: [],
      formControlName: 'FloorConstruction',
      selectedValues: this.data.filterProps?.FloorConstruction,
    },
    {
      title: 'Floor Insulation',
      data: [],
      formControlName: 'FloorInsulation',
      selectedValues: this.data.filterProps?.FloorInsulation,
    },
  ];
  roofFilters: MultiButtonFilterOption[] = [
    {
      title: 'Roof Construction',
      data: [],
      formControlName: 'RoofConstruction',
      selectedValues: this.data.filterProps?.RoofConstruction,
    },
    {
      title: 'Roof Insulation Location',
      data: [],
      formControlName: 'RoofInsulationLocation',
      selectedValues: this.data.filterProps?.RoofInsulationLocation,
    },
    {
      title: 'Roof Insulation Thickness',
      data: [],
      formControlName: 'RoofInsulationThickness',
      selectedValues: this.data.filterProps?.RoofInsulationThickness,
    },
  ];
  otherPanels: PanelData[] = [
    { panelTitle: 'General', filters: this.generalFilters },
    { panelTitle: 'Glazing', filters: this.glazingFilters },
    { panelTitle: 'Wall', filters: this.wallFilters },
    { panelTitle: 'Floor', filters: this.floorFilters },
    { panelTitle: 'Roof', filters: this.roofFilters },
  ];
  private unsubscribe$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      filterProps?: FilterProps;
      form: FormGroup;
    },
    private dialogRef: MatDialogRef<FilterPanelComponent>
  ) {
    this.advancedFiltersForm = this.data.form;

    this.setOptions();
    this.setValidOptions();

    this.advancedFiltersForm.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.setValidOptions();
      });
  }

  setOptions() {
    const allOptions = this.utilService.getAllUniqueFilterOptions(
      this.advancedFiltersForm.value
    );

    Object.keys(allOptions).forEach(key => {
      this.otherPanels.forEach(panel => {
        panel.filters.forEach(filter => {
          if (filter.formControlName === key) {
            filter.data = allOptions[key] ?? [];
          }
        });
      });
    });
  }

  setValidOptions() {
    const validOptions = this.utilService.getValidFilters(
      this.advancedFiltersForm.value
    );
    Object.keys(validOptions).forEach(key => {
      this.otherPanels.forEach(panel => {
        panel.filters.forEach(filter => {
          if (filter.formControlName === key) {
            filter.validOptions = validOptions[key] ?? [];
          }
        });
      });
    });
  }

  checkFiltersApplied(panelTitle: string) {
    if (
      panelTitle === 'General' &&
      Object.keys(this.advancedFiltersForm.value).every(
        key => this.advancedFiltersForm.value[key] === null
      )
    ) {
      // open first panel if form is empty
      return true;
    } else {
      const panel = this.otherPanels.find(
        panel => panel.panelTitle === panelTitle
      );
      return panel?.filters.some(filter => {
        return this.advancedFiltersForm.value[filter.formControlName];
      });
    }
  }

  clearAll() {
    this.advancedFiltersForm.reset();
    this.dialogRef.close({ clear: true });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
