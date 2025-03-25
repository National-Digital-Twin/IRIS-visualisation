import { AsyncPipe, DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, InputSignal, OnInit, OutputEmitterRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { LabelComponent } from '@components/label/label.component';
import { InfoPanelComponent } from '@containers/info-panel';
import {
    BuildForm,
    FloorConstruction,
    FloorInsulation,
    InvalidateFlagReason,
    RoofConstruction,
    RoofInsulationLocation,
    RoofInsulationThickness,
    WallConstruction,
    WallInsulation,
    WindowGlazing,
} from '@core/enums';
import { BuildingModel } from '@core/models/building.model';
import { DownloadDataWarningData, DownloadDataWarningResponse } from '@core/models/download-data-warning.model';
import { DataService } from '@core/services/data.service';
import { UtilService } from '@core/services/utils.service';
import { EMPTY, switchMap } from 'rxjs';

@Component({
    selector: 'c477-details-panel',
    imports: [
        AsyncPipe,
        DatePipe,
        NgClass,
        NgTemplateOutlet,
        MatButtonModule,
        MatDividerModule,
        MatIconModule,
        MatProgressBarModule,
        MatTabsModule,
        LabelComponent,
        InfoPanelComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './details-panel.component.html',
    styleUrl: './details-panel.component.scss',
})
export class DetailsPanelComponent implements OnInit {
    readonly #dataService = inject(DataService);
    readonly #dialog = inject(MatDialog);
    readonly #utilService = inject(UtilService);

    public resultsPanelCollapsed: InputSignal<boolean> = input(false);

    public closePanel: OutputEmitterRef<void> = output();
    public downloadData: OutputEmitterRef<DownloadDataWarningResponse> = output();
    public flag: OutputEmitterRef<BuildingModel[]> = output();
    public getFlagHistory: OutputEmitterRef<string> = output();
    public removeFlag: OutputEmitterRef<BuildingModel> = output();

    public activeFlag$ = toObservable(this.#dataService.activeFlag);
    public buildForm: Record<string, string> = BuildForm;
    public buildingDetails = this.#dataService.selectedBuilding;
    public buildingSelection = this.#dataService.buildingsSelection;
    public flagHistory$ = toObservable(this.#dataService.flagHistory);
    public floor: Record<string, string> = FloorConstruction;
    public floorInsulation: Record<string, string> = FloorInsulation;
    public invalidateReason: Record<string, string> = InvalidateFlagReason;
    public roof: Record<string, string> = RoofConstruction;
    public roofInsulation: Record<string, string> = RoofInsulationLocation;
    public roofInsulationThickness: Record<string, string> = RoofInsulationThickness;
    public wall: Record<string, string> = WallConstruction;
    public wallInsulation: Record<string, string> = WallInsulation;
    public windowGlazing: Record<string, string> = WindowGlazing;

    private readonly updateFlagHistory$ = toObservable(this.buildingDetails).pipe(
        takeUntilDestroyed(),
        switchMap((b) => (b ? this.#dataService.updateFlagHistory(b.UPRN) : EMPTY)),
    );

    /** subscribe to the flag history to make updates */
    public ngOnInit(): void {
        this.updateFlagHistory$.pipe().subscribe();
    }

    public getAddressSegment(index: number): string {
        return this.#utilService.splitAddress(index, this.buildingDetails()?.FullAddress);
    }

    public epcExpired(): boolean {
        return this.#utilService.epcExpired(this.buildingDetails()?.InspectionDate);
    }

    public openDownloadWarning(): void {
        this.#dialog
            .open<DownloadWarningComponent, DownloadDataWarningData, DownloadDataWarningResponse>(DownloadWarningComponent, {
                panelClass: 'download-modal',
                width: '90%',
                maxWidth: '50rem',
                data: {
                    addresses: [this.buildingDetails()?.FullAddress ?? ''],
                    addressCount: undefined,
                },
            })
            .afterClosed()
            .subscribe((download) => {
                if (download) {
                    this.downloadData.emit(download);
                }
            });
    }

    public tabChanged($event: MatTabChangeEvent): void {
        if ($event.tab.textLabel === 'Flag') {
            const building = this.buildingDetails();
            if (building) {
                const { UPRN } = building;
                this.#dataService.updateFlagHistory(UPRN).subscribe();
            }
        }
    }
}
