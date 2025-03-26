import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MultiButtonFilterComponent } from '@components/multi-button-filter/multi-button-filter.component';
import { FilterProps, MultiButtonFilterOption } from '@core/models/advanced-filters.model';
import { UtilService } from '@core/services/utils.service';
import { map } from 'rxjs';

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
        MatIconModule,
        MatExpansionModule,
        MultiButtonFilterComponent,
        ReactiveFormsModule,
    ],
    templateUrl: './filter-panel.component.html',
    styleUrl: './filter-panel.component.scss',
})
export class FilterPanelComponent {
    readonly #data: DialogData = inject(MAT_DIALOG_DATA);
    readonly #dialogRef = inject(MatDialogRef<FilterPanelComponent>);
    readonly #utilService = inject(UtilService);
    readonly #destroyRef = inject(DestroyRef);

    public advancedFiltersForm: FormGroup;
    public noValidFilterOptions: boolean = false;

    private readonly expiredOptions = ['EPC In Date', 'EPC Expired'];

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

        this.advancedFiltersForm.valueChanges
            .pipe(
                map(() => this.setValidOptions()),
                takeUntilDestroyed(this.#destroyRef),
            )
            .subscribe();
    }

    get dialogData(): DialogData {
        return this.#data;
    }

    public clearAll(): void {
        this.advancedFiltersForm.reset();
        this.#dialogRef.close({ clear: true });
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
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
