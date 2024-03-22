import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  of,
  Observable,
  switchMap,
  tap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';

import { FilterPanelComponent } from '@containers/filter-panel/filter-panel.component';
import { LabelComponent } from '@components/label/label.component';

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
import {
  AdvancedFiltersFormModel,
  EPCExpiry,
  FilterProps,
} from '@core/models/advanced-filters.model';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { AddressSearchService } from '@core/services/address-search.service';
import { AddressSearchData } from '@core/models/address-search-results.model';
import { MapService } from '@core/services/map.service';

@Component({
  selector: 'c477-main-filters',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatAutocompleteModule,
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
  ],
  templateUrl: './main-filters.component.html',
  styleUrl: './main-filters.component.css',
})
export class MainFiltersComponent implements OnChanges {
  @Input() filterProps?: FilterProps;
  @Output() setRouteParams: EventEmitter<{ [key: string]: string[] }> =
    new EventEmitter<{ [key: string]: string[] }>();
  @Output() setAdvancedFilters: EventEmitter<AdvancedFiltersFormModel> =
    new EventEmitter<AdvancedFiltersFormModel>();
  @Output() addressSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() clearAllFilters: EventEmitter<null> = new EventEmitter<null>();

  private fb: FormBuilder = inject(FormBuilder);
  private addressSearchService = inject(AddressSearchService);
  private mapService = inject(MapService);
  epcRatings: { [key: string]: string } = EPCRating;
  propertyTypes: { [key: string]: string } = PropertyType;
  addressSearch = new FormControl('');
  addressForm = this.fb.group({ address: this.addressSearch });
  advancedFiltersForm?: FormGroup;
  results$: Observable<AddressSearchData[]>;
  firstAddress?: AddressSearchData;
  numberFilters: number = 0;

  filterFlagged: boolean = false;

  constructor(public dialog: MatDialog) {
    this.results$ = this.addressSearch.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((value): Observable<AddressSearchData[]> => {
        if (value) {
          return this.searchHandler(value);
        } else {
          return of<AddressSearchData[]>([]);
        }
      }),
      tap(results => {
        if (results.length > 0) {
          this.firstAddress = results[0];
        } else {
          this.firstAddress = undefined;
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.filterProps) {
      // generate form to provide count on filters applied button
      this.advancedFiltersForm = this.createForm();
    }
  }

  getKeys(options: { [key: string]: string }) {
    return Object.keys(options);
  }

  /**
   * Conditionally handle which OS API to call depending on user input
   * @param query address or postcode search string
   * @returns address or postcode suggestions
   */
  searchHandler(query: string): Observable<AddressSearchData[]> {
    const isPostcode = this.checkForPostcode(query);
    const results = isPostcode
      ? this.addressSearchService.getPostCodes(query)
      : this.addressSearchService.getAddresses(query);
    return results;
  }

  /**
   * Remove postcode from address string
   * to prevent titlecase applying
   * @param address string
   * @returns substring without last item
   */
  removePostCode(address: string): string {
    const lastIndex = address.lastIndexOf(',');
    return address.substring(0, lastIndex);
  }

  /**
   * set the autocomplete option value to
   * be either postcode or address
   * @param value option value
   * @returns string to use as option value
   */
  getOptionValue(value: AddressSearchData) {
    return value.ADDRESS !== '' ? value.ADDRESS : value.POSTCODE;
  }

  /**
   * if the address has been selected in the autocomplete
   * zoom to that, otherwise zoom to first matching address
   * @param result AddressSearchData (optional)
   * @returns substring without last item
   */
  selectAddress(result?: AddressSearchData) {
    let coords;
    /** if address string is empty the it's a postcode result from the names API */
    if (result && result.ADDRESS !== '') {
      coords = [result.LNG, result.LAT];
      this.addressSelected.emit(result.TOPOGRAPHY_LAYER_TOID);
    } else if (this.firstAddress && this.firstAddress.ADDRESS !== '') {
      coords = [this.firstAddress.LNG, this.firstAddress.LAT];
      this.addressSelected.emit(this.firstAddress.TOPOGRAPHY_LAYER_TOID);
    }
    /** zoom to address */
    if (coords) {
      this.mapService.zoomToCoords(coords);
    }
    /** zoom to postcode */
    if (result && result.ADDRESS === '') {
      this.mapService.zoomToCoords([result.LNG, result.LAT], 16);
    }
  }

  openAdvancedFilters() {
    const dialogRef = this.dialog.open(FilterPanelComponent, {
      panelClass: 'filter-panel',
      data: {
        filterProps: this.filterProps,
        form: this.advancedFiltersForm,
      },
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res && res.value) {
        this.setAdvancedFilters.emit(res.value);
      } else if (res && res.clear) {
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

  countFilters(formValue: AdvancedFiltersFormModel): number {
    return Object.keys(formValue).reduce((acc, val) => {
      return (
        acc + (formValue[val as keyof AdvancedFiltersFormModel]?.length ?? 0)
      );
    }, 0);
  }

  propertyTypeChange(e: MatSelectChange) {
    this.setRouteParams.emit({ PropertyType: e.value });
  }

  ratingChange(e: MatSelectChange) {
    this.setRouteParams.emit({ EPC: e.value.map((r: string) => r) });
  }

  flaggedFilterChange(e: MatSlideToggleChange) {
    if (e.checked) {
      this.setRouteParams.emit({ Flagged: ['true'] });
    } else {
      this.setRouteParams.emit({ Flagged: [] });
    }
  }

  createForm(): FormGroup {
    this.advancedFiltersForm = this.fb.group<AdvancedFiltersFormModel>({
      PostCode: [this.filterProps?.PostCode as unknown as PostCode],
      BuildForm: [this.filterProps?.BuildForm as unknown as BuildForm],
      YearOfAssessment: [
        this.filterProps?.YearOfAssessment as unknown as YearOfAssessment,
      ],
      WindowGlazing: [
        this.filterProps?.WindowGlazing as unknown as WindowGlazing,
      ],
      WallConstruction: [
        this.filterProps?.WallConstruction as unknown as WallConstruction,
      ],
      WallInsulation: [
        this.filterProps?.WallInsulation as unknown as WallInsulation,
      ],
      FloorConstruction: [
        this.filterProps?.FloorConstruction as unknown as FloorConstruction,
      ],
      FloorInsulation: [
        this.filterProps?.FloorInsulation as unknown as FloorInsulation,
      ],
      RoofConstruction: [
        this.filterProps?.RoofConstruction as unknown as RoofConstruction,
      ],
      RoofInsulationLocation: [
        this.filterProps
          ?.RoofInsulationLocation as unknown as RoofInsulationLocation,
      ],
      RoofInsulationThickness: [
        this.filterProps
          ?.RoofInsulationThickness as unknown as RoofInsulationThickness,
      ],
      EPCExpiry: [this.filterProps?.EPCExpiry as unknown as EPCExpiry],
    });
    this.numberFilters = this.countFilters(this.advancedFiltersForm.value);
    return this.advancedFiltersForm;
  }

  clearEPC($event: Event) {
    $event.stopPropagation();
    this.setRouteParams.emit({ EPC: [] });
  }

  clearPropertyType($event: Event) {
    $event.stopPropagation();
    this.setRouteParams.emit({ PropertyType: [] });
  }

  clearAll() {
    this.numberFilters = 0;
    this.advancedFiltersForm?.reset();
    this.clearAllFilters.emit();
  }

  /**
   * Check if search string is a IoW postcode.
   * @param query search string
   * @returns boolean
   */
  private checkForPostcode(query: string): boolean {
    if (
      query.slice(0, 3).toLocaleLowerCase() === 'po3' ||
      query.slice(0, 3).toLocaleLowerCase() === 'po4'
    ) {
      return true;
    } else {
      return false;
    }
  }
}
