import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LabelComponent } from '@components/label/label.component';
import { FilterPanelComponent } from '@containers/filter-panel/filter-panel.component';
import {
    BuildForm,
    EPCRating,
    FloorConstruction,
    FloorInsulation,
    PostCode,
    PropertyType,
    RoofConstruction,
    RoofInsulationLocation,
    RoofInsulationThickness,
    WallConstruction,
    WallInsulation,
    WindowGlazing,
    YearOfAssessment,
} from '@core/enums';
import { AddressSearchData } from '@core/models/address-search-results.model';
import { AdvancedFiltersFormModel, EPCExpiry, FilterProps } from '@core/models/advanced-filters.model';
import { AddressSearchService } from '@core/services/address-search.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { LngLat } from 'mapbox-gl';
import { Observable, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

@Component({
    selector: 'c477-main-filters',
    imports: [
        CommonModule,
        LabelComponent,
        MatAutocompleteModule,
        MatBadgeModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule,
        ReactiveFormsModule,
    ],
    templateUrl: './main-filters.component.html',
    styleUrl: './main-filters.component.scss',
    providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }],
})
export class MainFiltersComponent implements OnChanges {
    readonly #fb: FormBuilder = inject(FormBuilder);
    readonly #addressSearchService = inject(AddressSearchService);
    readonly #mapService = inject(MapService);
    readonly #spatialQueryService = inject(SpatialQueryService);

    @Input() public filterProps?: FilterProps;

    @Output() public addressSelected: EventEmitter<string> = new EventEmitter<string>();
    @Output() public clearAllFilters: EventEmitter<null> = new EventEmitter<null>();
    @Output() public setAdvancedFilters: EventEmitter<AdvancedFiltersFormModel> = new EventEmitter<AdvancedFiltersFormModel>();
    @Output() public setRouteParams: EventEmitter<{ [key: string]: string[] }> = new EventEmitter<{ [key: string]: string[] }>();

    public addressForm: FormGroup;
    public epcRatings: { [key: string]: string } = EPCRating;
    public numberFilters: number = 0;
    public propertyTypes: { [key: string]: string } = PropertyType;
    public results$: Observable<AddressSearchData[]>;

    private advancedFiltersForm?: FormGroup;
    private firstAddress?: AddressSearchData;

    constructor(public dialog: MatDialog) {
        const addressSearch = new FormControl('');
        this.addressForm = new FormGroup({ address: addressSearch });

        this.results$ = addressSearch.valueChanges.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap((value): Observable<AddressSearchData[]> => {
                if (value) {
                    return this.#addressSearchService.getAddresses(value);
                } else {
                    return of<AddressSearchData[]>([]);
                }
            }),
            tap((results) => {
                if (results.length > 0) {
                    this.firstAddress = results[0];
                } else {
                    this.firstAddress = undefined;
                }
            }),
        );
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.filterProps) {
            // generate form to provide count on filters applied button
            this.advancedFiltersForm = this.createForm();
        }
    }

    public getKeys(options: { [key: string]: string }): string[] {
        return Object.keys(options);
    }

    /**
     * Remove postcode from address string
     * to prevent titlecase applying
     * @param address string
     * @returns substring without last item
     */
    public removePostCode(address: string): string {
        const lastIndex = address.lastIndexOf(',');
        return address.substring(0, lastIndex);
    }

    /**
     * set the autocomplete option value to
     * be either postcode or address
     * @param value option value
     * @returns string to use as option value
     */
    public getOptionValue(value: AddressSearchData): string {
        return value.ADDRESS !== '' ? value.ADDRESS : value.POSTCODE;
    }

    /**
     * if the address has been selected in the autocomplete
     * zoom to that, otherwise zoom to first matching address
     * @param result AddressSearchData (optional)
     * @returns substring without last item
     */
    public selectAddress(result?: AddressSearchData): void {
        let coords: LngLat;

        /** if address string is empty the it's a postcode result from the names API */
        if (result && result.ADDRESS !== '') {
            coords = new LngLat(result.LNG, result.LAT);
            this.addressSelected.emit(result.TOPOGRAPHY_LAYER_TOID);
            this.#mapService.zoomToCoords(coords);
        } else if (this.firstAddress && this.firstAddress.ADDRESS !== '') {
            coords = new LngLat(this.firstAddress.LNG, this.firstAddress.LAT);
            this.addressSelected.emit(this.firstAddress.TOPOGRAPHY_LAYER_TOID);
            this.#mapService.zoomToCoords(coords);
        }

        /** zoom to postcode */
        if (result && result.ADDRESS === '') {
            this.#mapService.zoomToCoords([result.LNG, result.LAT], 16);
        }
    }

    public openAdvancedFilters(): void {
        const dialogRef = this.dialog.open(FilterPanelComponent, {
            panelClass: 'filter-panel',
            data: {
                filterProps: this.filterProps,
                form: this.advancedFiltersForm,
            },
        });
        dialogRef.afterClosed().subscribe((res) => {
            if (res?.value) {
                this.setAdvancedFilters.emit(res.value);
            } else if (res?.clear) {
                this.numberFilters = 0;
                this.setAdvancedFilters.emit({
                    PostCode: [],
                    BuildForm: [],
                    WindowGlazing: [],
                    WallConstruction: [],
                    WallInsulation: [],
                    FloorConstruction: [],
                    FloorInsulation: [],
                    RoofConstruction: [],
                    RoofInsulationLocation: [],
                    RoofInsulationThickness: [],
                    YearOfAssessment: [],
                    EPCExpiry: [],
                });
            } else {
                // reset the form to the original values on cancel
                this.createForm();
            }
        });
    }

    private countFilters(formValue: AdvancedFiltersFormModel): number {
        return Object.keys(formValue).reduce((acc, val) => {
            return acc + (formValue[val as keyof AdvancedFiltersFormModel]?.length ?? 0);
        }, 0);
    }

    public propertyTypeChange(e: MatSelectChange): void {
        this.setRouteParams.emit({ PropertyType: e.value });
    }

    public ratingChange(e: MatSelectChange): void {
        this.setRouteParams.emit({ EPC: e.value.map((r: string) => r) });
    }

    public flaggedFilterChange(e: MatSlideToggleChange): void {
        if (e.checked) {
            this.setRouteParams.emit({ Flagged: ['true'] });
        } else {
            this.setRouteParams.emit({ Flagged: [] });
        }
    }

    private createForm(): FormGroup {
        this.advancedFiltersForm = this.#fb.group<AdvancedFiltersFormModel>({
            PostCode: [this.filterProps?.PostCode as unknown as PostCode],
            BuildForm: [this.filterProps?.BuildForm as unknown as BuildForm],
            YearOfAssessment: [this.filterProps?.YearOfAssessment as unknown as YearOfAssessment],
            WindowGlazing: [this.filterProps?.WindowGlazing as unknown as WindowGlazing],
            WallConstruction: [this.filterProps?.WallConstruction as unknown as WallConstruction],
            WallInsulation: [this.filterProps?.WallInsulation as unknown as WallInsulation],
            FloorConstruction: [this.filterProps?.FloorConstruction as unknown as FloorConstruction],
            FloorInsulation: [this.filterProps?.FloorInsulation as unknown as FloorInsulation],
            RoofConstruction: [this.filterProps?.RoofConstruction as unknown as RoofConstruction],
            RoofInsulationLocation: [this.filterProps?.RoofInsulationLocation as unknown as RoofInsulationLocation],
            RoofInsulationThickness: [this.filterProps?.RoofInsulationThickness as unknown as RoofInsulationThickness],
            EPCExpiry: [this.filterProps?.EPCExpiry as unknown as EPCExpiry],
        });
        this.numberFilters = this.countFilters(this.advancedFiltersForm.value);
        return this.advancedFiltersForm;
    }

    public clearEPC($event: Event): void {
        $event.stopPropagation();
        this.setRouteParams.emit({ EPC: [] });
    }

    public clearPropertyType($event: Event): void {
        $event.stopPropagation();
        this.setRouteParams.emit({ PropertyType: [] });
    }

    public clearAll(): void {
        this.numberFilters = 0;
        this.advancedFiltersForm?.reset();
        this.clearAllFilters.emit();
    }

    public filtersExist(): boolean {
        return (this.filterProps && Object.keys(this.filterProps).length > 0) || this.#spatialQueryService.spatialFilterEnabled();
    }
}
