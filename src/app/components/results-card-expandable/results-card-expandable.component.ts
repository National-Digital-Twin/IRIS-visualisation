import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, input, InputSignal, output, OutputEmitterRef, signal, WritableSignal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { EPCRating } from '@core/enums';
import { BuildingModel } from '@core/models/building.model';
import { DownloadBuilding } from '@core/models/download-data-warning.model';
import { UtilService } from '@core/services/utils.service';

@Component({
    selector: 'c477-results-card-expandable',
    imports: [NgClass, MatExpansionModule, ResultsCardComponent],
    templateUrl: './results-card-expandable.component.html',
    styleUrl: './results-card-expandable.component.scss',
})
export class ResultsCardExpandableComponent {
    readonly #utilService = inject(UtilService);

    public buildingUPRN: InputSignal<string | undefined> = input();
    public checkedCards = input<BuildingModel[]>([]);
    public dwellings = input<BuildingModel[]>([]);
    public select: InputSignal<boolean> = input<boolean>(false);
    public checked: WritableSignal<boolean> = signal(false);

    public cardSelected: OutputEmitterRef<BuildingModel> = output();
    public emitViewDetails: OutputEmitterRef<BuildingModel> = output();
    public flag: OutputEmitterRef<BuildingModel[]> = output();
    public removeFlag: OutputEmitterRef<BuildingModel> = output();
    public toggleChecked: OutputEmitterRef<BuildingModel> = output();
    public downloadData: OutputEmitterRef<DownloadBuilding> = output();

    public parentDataset: BuildingModel = {
        BuiltForm: undefined,
        EPC: undefined,
        FullAddress: '',
        LodgementDate: undefined,
        ParentTOID: '',
        PostCode: undefined,
        StructureUnitType: undefined,
        UPRN: '',
        Flagged: undefined,
        SAPPoints: undefined,
        YearOfAssessment: undefined,
        FloorConstruction: undefined,
        FloorInsulation: undefined,
        RoofConstruction: undefined,
        RoofInsulationThickness: undefined,
        RoofInsulationLocation: undefined,
        WallConstruction: undefined,
        WallInsulation: undefined,
        WindowGlazing: undefined,
        latitude: undefined,
        longitude: undefined,
    };

    public sortedDwellings = computed(() => this.dwellings().sort((a, b) => +a.UPRN - +b.UPRN));

    constructor() {
        effect(() => {
            const dwellings = this.dwellings();

            if (dwellings.length <= 0) {
                return;
            }

            const dwelling = dwellings[0];
            this.parentDataset.FullAddress = dwelling.FullAddress.split(/,(.*)/s)[1];
            this.parentDataset.ParentTOID = dwelling.ParentTOID;

            const EPCs = dwellings.map((d) => (d.EPC ? EPCRating[d.EPC] : undefined)).filter((d) => d !== undefined);

            this.parentDataset.EPC = this.#utilService.getMeanEPCValue(EPCs as string[]) as EPCRating;
        });
    }

    public containsBuilding(): boolean {
        const dwellings = this.dwellings();
        const targetUPRN = this.buildingUPRN();

        if (!targetUPRN) {
            return false;
        }

        return dwellings.map(({ UPRN }) => UPRN).includes(targetUPRN);
    }

    public onToggleCheckedDwellings(checked: boolean): void {
        const dwellings = this.dwellings();
        this.checked.set(false);

        dwellings.forEach((d) => {
            const isChecked = this.isChecked(d);
            if (checked !== isChecked) {
                this.checked.set(true);
                this.toggleChecked.emit(d);
            }
        });
    }

    public isChecked(dwelling: BuildingModel): boolean {
        const checkedCards = this.checkedCards();
        return !!checkedCards.find((cc) => cc.UPRN === dwelling.UPRN);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
