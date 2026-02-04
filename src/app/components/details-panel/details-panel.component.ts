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
import { WarningSection } from '@components/warning-section/warning-section';
import { InfoPanelComponent } from '@containers/info-panel';
import {
    BuiltForm,
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
import { FuelType } from '@core/enums/fuel-type';
import { RoofMaterial } from '@core/enums/roof-material';
import { RoofShape } from '@core/enums/roof-shape';
import { SolarPanelPresence } from '@core/enums/solar-panel-presence';
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
        WarningSection,
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
    public builtForm: Record<string, string> = BuiltForm;
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
    public fuelType: Record<string, string> = FuelType;
    public roofMaterial: Record<string, string> = RoofMaterial;
    public roofShape: Record<string, string> = RoofShape;
    public solarPanelPresence: Record<string, string> = SolarPanelPresence;

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
        return this.#utilService.epcExpired(this.buildingDetails()?.LodgementDate);
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

    public formatRoofAspectAreas(building?: BuildingModel): string {
        if (!building) return '';
        const entries: string[] = [];
        const add = (dir: string, value?: string): void => {
            if (!value) return;
            const n = Number(value);
            if (!Number.isNaN(n)) {
                if (n === 0) return; // skip zeros
                const rounded = Math.round(n);
                entries.push(`${rounded}m² ${dir}`);
            } else {
                // Non-numeric value; include as-is
                entries.push(`${value}m² ${dir}`);
            }
        };
        add('North', building.RoofAspectAreaNorth);
        add('North East', building.RoofAspectAreaNortheast);
        add('East', building.RoofAspectAreaEast);
        add('South East', building.RoofAspectAreaSoutheast);
        add('South', building.RoofAspectAreaSouth);
        add('South West', building.RoofAspectAreaSouthwest);
        add('West', building.RoofAspectAreaWest);
        add('North West', building.RoofAspectAreaNorthwest);
        add('Unknown', building.RoofAspectAreaIndeterminable);
        return entries.join(', ');
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
