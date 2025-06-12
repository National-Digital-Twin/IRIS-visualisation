import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OutputEmitterRef, WritableSignal, effect, inject, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { ResultsCardExpandableComponent } from '@components/results-card-expandable/results-card-expandable.component';
import { ResultsPanelButtonComponent } from '@components/results-panel-button/results-panel-button.component';
import { InfoPanelComponent } from '@containers/info-panel';
import { BuildingModel } from '@core/models/building.model';
import { DownloadBuilding, DownloadDataWarningData, DownloadDataWarningResponse } from '@core/models/download-data-warning.model';
import { DataDownloadService } from '@core/services/data-download.service';
import { DataService } from '@core/services/data.service';
import { MAP_SERVICE } from '@core/services/map.token';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { UtilService } from '@core/services/utils.service';
import { LngLat } from 'mapbox-gl';
import { filter, map } from 'rxjs';

@Component({
    selector: 'c477-results-panel',
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        ResultsPanelButtonComponent,
        ResultsCardComponent,
        ResultsCardExpandableComponent,
        ScrollingModule,
        InfoPanelComponent,
    ],
    templateUrl: './results-panel.component.html',
    styleUrl: './results-panel.component.scss',
})
export class ResultsPanelComponent {
    readonly #dataService = inject(DataService);
    readonly #spatialQueryService = inject(SpatialQueryService);
    readonly #utilService = inject(UtilService);
    readonly #dataDownloadService = inject(DataDownloadService);
    readonly #mapService = inject(MAP_SERVICE);

    public buildingSelection = this.#dataService.buildingsSelection;
    public checkedCards = signal<BuildingModel[]>([]);
    public panelOpen: WritableSignal<boolean> = signal(true);
    public selectMultiple: boolean = false;
    public selectedCardUPRN = this.#utilService.selectedCardUPRN;

    public flag: OutputEmitterRef<BuildingModel[]> = output();
    public removeFlag: OutputEmitterRef<BuildingModel> = output();
    public resultsPanelCollapsed: OutputEmitterRef<boolean> = output();

    public viewPort = viewChild<CdkVirtualScrollViewport>(CdkVirtualScrollViewport);
    public dialog = inject(MatDialog);

    constructor() {
        /** listen for UPRN set from map click */
        effect(() => {
            const selectedUPRN = this.#utilService.selectedUPRN();
            const selectedTOID = this.#utilService.multiDwelling();
            const viewPort = this.viewPort();

            if (!viewPort) {
                return;
            }

            if (selectedUPRN) {
                const idx = this.buildingSelection()?.findIndex((building) => building[0].UPRN === selectedUPRN);
                if (idx && idx > -1) {
                    /** scroll to index*/
                    viewPort.scrollToIndex(idx);
                }
            }
            if (selectedTOID) {
                const idx = this.buildingSelection()?.findIndex((building) => building[0].ParentTOID === selectedTOID);
                if (idx && idx > -1) {
                    /** scroll to index*/
                    viewPort.scrollToIndex(idx);
                }
            }
        });
    }

    get mapInstance(): mapboxgl.Map {
        return this.#mapService.mapInstance;
    }

    public cardIsChecked(buildings: BuildingModel[]): boolean {
        const checkedCards = this.checkedCards();
        return buildings.some((b) => checkedCards.find((cc) => cc.UPRN === b.UPRN));
    }

    public onToggleChecked(building: BuildingModel): void {
        this.checkedCards.update((cards) => (this.cardIsChecked([building]) ? cards.filter((c) => c.UPRN !== building.UPRN) : [...cards, building]));
    }

    /**
     * View Details button handler
     * @param building selected building
     */
    public viewDetails(selectedBuilding: BuildingModel): void {
        const TOID = selectedBuilding.TOID ?? selectedBuilding.ParentTOID;

        const center = this.getZoomCenter(TOID!);
        this.#utilService.viewDetailsButtonClick(TOID!, selectedBuilding.UPRN, center);
    }

    /**
     * Single dwelling results card handler
     * @param selectedBuilding building for selected card
     */
    public cardSelected(selectedBuilding: BuildingModel): void {
        const TOID = selectedBuilding.TOID ?? selectedBuilding.ParentTOID;
        const UPRN = selectedBuilding.UPRN;
        /**
         * if selected card building uprn === the current selected card uprn
         * deselect card and building
         */
        if (this.#utilService.selectedCardUPRN() === selectedBuilding.UPRN || this.#utilService.multiDwelling() === TOID) {
            /** deselect card */
            this.#utilService.resultsCardDeselected();
        } else {
            /** select card */
            this.#utilService.resultsCardSelected(TOID!, UPRN);
        }
    }

    public trackByUPRN(index: number, item: BuildingModel[]): string | undefined {
        if (item.length === 1) {
            return item[0].UPRN;
        } else {
            return item[0].ParentTOID;
        }
    }

    private getZoomCenter(TOID: string): LngLat {
        const geomBB = this.#spatialQueryService.getFeatureGeomBB(TOID);
        return new LngLat(geomBB.getCenter().lng - 0.0005, geomBB.getCenter().lat);
    }

    public updatePanelOpen(event: boolean): void {
        this.panelOpen.set(event);
        this.resultsPanelCollapsed.emit(!event);
    }

    public downloadAll(): void {
        let addresses: string[] = [];
        let addressCount = undefined;
        /** download selected */

        const buildingSelection = this.buildingSelection();

        if (this.selectMultiple) {
            if (this.checkedCards().length <= 10) {
                this.checkedCards().map((building: BuildingModel) => addresses.push(building.FullAddress));
            } else {
                addressCount = this.checkedCards().length;
            }
        } else if (buildingSelection && buildingSelection.flat().length <= 10) {
            buildingSelection.flat().map((building: BuildingModel) => addresses.push(building.FullAddress));
        } else if (buildingSelection && buildingSelection.flat().length > 10) {
            addressCount = buildingSelection.flat().length;
        }

        this.dialog
            .open<DownloadWarningComponent, DownloadDataWarningData, DownloadDataWarningResponse>(DownloadWarningComponent, {
                panelClass: 'download-modal',
                width: '90%',
                maxWidth: '50rem',
                data: {
                    addresses,
                    addressCount,
                },
            })
            .afterClosed()
            .pipe(
                filter((download) => !!download),
                map((download) => {
                    const checkedCards = this.checkedCards();
                    const buildingSelection = this.buildingSelection();

                    switch (download) {
                        case 'xlsx':
                            if (this.selectMultiple) {
                                this.#dataDownloadService.downloadXlsxData(checkedCards);
                            } else if (buildingSelection) {
                                this.#dataDownloadService.downloadXlsxData(buildingSelection.flat());
                            }
                            break;
                        case 'csv':
                            if (this.selectMultiple) {
                                this.#dataDownloadService.downloadCSVData(checkedCards);
                            } else if (buildingSelection) {
                                this.#dataDownloadService.downloadCSVData(buildingSelection.flat());
                            }
                            break;
                    }
                    addresses = [];
                    addressCount = undefined;
                }),
            )
            .subscribe();
    }

    public downloadBuilding(result: DownloadBuilding): void {
        if (result.format === 'xlsx') {
            this.#dataDownloadService.downloadXlsxData([result.building]);
        } else if (result.format === 'csv') {
            this.#dataDownloadService.downloadCSVData([result.building]);
        }
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
