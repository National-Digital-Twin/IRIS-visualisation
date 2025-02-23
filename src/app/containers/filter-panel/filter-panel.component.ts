import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MultiButtonFilterComponent } from '@components/multi-button-filter/multi-button-filter.component';
import { FilterProps, MultiButtonFilterOption } from '@core/models/advanced-filters.model';
import { UtilService } from '@core/services/utils.service';
import { Subject, takeUntil } from 'rxjs';

type DialogData = {
    filterProps?: FilterProps;
    form: FormGroup;
};

type PanelData = {
    panelTitle: string;
    filters: MultiButtonFilterOption[];
};

@Component({
    selector: 'c477-filter-panel',
    imports: [
        CommonModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        MatIconModule,
        MatExpansionModule,
        MultiButtonFilterComponent,
        ReactiveFormsModule,
    ],
    templateUrl: './filter-panel.component.html',
})
export class FilterPanelComponent implements OnDestroy {
    readonly #data: DialogData = inject(MAT_DIALOG_DATA);
    readonly #dialogRef = inject(MatDialogRef<FilterPanelComponent>);
    readonly #utilService = inject(UtilService);

    public advancedFiltersForm: FormGroup;
    public noValidFilterOptions: boolean = false;

    private readonly expiredOptions = ['EPC In Date', 'EPC Expired'];
    private readonly unsubscribe$ = new Subject<void>();

    private readonly generalFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Post Code',
            data: [],
            formControlName: 'PostCode',
            selectedValues: this.#data.filterProps?.PostCode,
        },
        {
            title: 'Build Form',
            data: [],
            formControlName: 'BuildForm',
            selectedValues: this.#data.filterProps?.BuildForm,
        },
        {
            title: 'Year of Inspection',
            data: [],
            formControlName: 'YearOfAssessment',
            selectedValues: this.#data.filterProps?.YearOfAssessment,
        },
        {
            title: 'EPC Expiry',
            data: this.expiredOptions,
            formControlName: 'EPCExpiry',
            selectedValues: this.#data.filterProps?.EPCExpiry,
        },
    ]);

    private readonly glazingFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Multiple Glazing Type',
            data: [],
            formControlName: 'WindowGlazing',
            selectedValues: this.#data.filterProps?.WindowGlazing,
        },
    ]);

    private readonly wallFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Wall Construction',
            data: [],
            formControlName: 'WallConstruction',
            selectedValues: this.#data.filterProps?.WallConstruction,
        },
        {
            title: 'Wall Insulation',
            data: [],
            formControlName: 'WallInsulation',
            selectedValues: this.#data.filterProps?.WallInsulation,
        },
    ]);

    private readonly floorFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Floor Construction',
            data: [],
            formControlName: 'FloorConstruction',
            selectedValues: this.#data.filterProps?.FloorConstruction,
        },
        {
            title: 'Floor Insulation',
            data: [],
            formControlName: 'FloorInsulation',
            selectedValues: this.#data.filterProps?.FloorInsulation,
        },
    ]);

    private readonly roofFilters = signal<MultiButtonFilterOption[]>([
        {
            title: 'Roof Construction',
            data: [],
            formControlName: 'RoofConstruction',
            selectedValues: this.#data.filterProps?.RoofConstruction,
        },
        {
            title: 'Roof Insulation Location',
            data: [],
            formControlName: 'RoofInsulationLocation',
            selectedValues: this.#data.filterProps?.RoofInsulationLocation,
        },
        {
            title: 'Roof Insulation Thickness',
            data: [],
            formControlName: 'RoofInsulationThickness',
            selectedValues: this.#data.filterProps?.RoofInsulationThickness,
        },
    ]);

    public otherPanels = computed<PanelData[]>(() => [
        { panelTitle: 'General', filters: this.generalFilters() },
        { panelTitle: 'Glazing', filters: this.glazingFilters() },
        { panelTitle: 'Wall', filters: this.wallFilters() },
        { panelTitle: 'Floor', filters: this.floorFilters() },
        { panelTitle: 'Roof', filters: this.roofFilters() },
    ]);

    constructor() {
        this.advancedFiltersForm = this.#data.form;

        this.setOptions();
        this.setValidOptions();

        this.advancedFiltersForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            this.setValidOptions();
        });
    }

    get dialogData(): DialogData {
        return this.#data;
    }

    public ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    private setOptions(): void {
        const allOptions = this.#utilService.getAllUniqueFilterOptions(this.advancedFiltersForm.value);

        Object.keys(allOptions).forEach((key) => {
            this.otherPanels().map((panel) => {
                panel.filters.map((filter) => {
                    if (filter.formControlName === key) {
                        filter.data = allOptions[key] ?? filter.data;
                    }
                });
            });
        });
    }

    private setValidOptions(): void {
        const validOptions = this.#utilService.getValidFilters(this.advancedFiltersForm.value);
        Object.keys(validOptions).forEach((key) => {
            this.otherPanels().map((panel) => {
                panel.filters.map((filter) => {
                    if (filter.formControlName === key) {
                        filter.validOptions = validOptions[key];
                    }
                });
            });
        });

        this.noValidFilterOptions = Object.keys(validOptions).every((key) => {
            return validOptions[key as keyof FilterProps]?.length === 0;
        });
    }

    public checkFiltersApplied(panelTitle: string): boolean {
        if (panelTitle === 'General' && Object.keys(this.advancedFiltersForm.value).every((key) => this.advancedFiltersForm.value[key] === null)) {
            // open first panel if form is empty
            return true;
        } else {
            const panel = this.otherPanels().find((panel) => panel.panelTitle === panelTitle);

            if (!panel) {
                return false;
            }

            return panel.filters.some((filter) => {
                return this.advancedFiltersForm.value[filter.formControlName];
            });
        }
    }

    public clearAll(): void {
        this.advancedFiltersForm.reset();
        this.#dialogRef.close({ clear: true });
    }
}
