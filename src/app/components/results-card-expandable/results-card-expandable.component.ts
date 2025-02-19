import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { EPCRating } from '@core/enums';
import { BuildingModel } from '@core/models/building.model';
import { UtilService } from '@core/services/utils.service';

@Component({
    selector: 'c477-results-card-expandable[cardIsChecked]',
    imports: [CommonModule, MatExpansionModule, ResultsCardComponent],
    templateUrl: './results-card-expandable.component.html',
    styleUrl: './results-card-expandable.component.scss',
})
export class ResultsCardExpandableComponent implements OnChanges {
    readonly #utilService = inject(UtilService);

    @Input() public buildingTOID?: string;
    @Input() public cardIsChecked!: (_: BuildingModel[]) => boolean;
    @Input() public dwellings!: BuildingModel[];
    @Input() public select: boolean = false;

    @Output() public cardSelected: EventEmitter<BuildingModel> = new EventEmitter<BuildingModel>();
    @Output() public emitViewDetails: EventEmitter<BuildingModel> = new EventEmitter<BuildingModel>();
    @Output() public flag = new EventEmitter<BuildingModel[]>();
    @Output() public removeFlag = new EventEmitter<BuildingModel>();
    @Output() public toggleChecked = new EventEmitter<BuildingModel>();

    public parentDataset: BuildingModel = {
        BuildForm: undefined,
        EPC: undefined,
        FullAddress: '',
        InspectionDate: undefined,
        ParentTOID: '',
        PostCode: undefined,
        PropertyType: undefined,
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

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.dwellings) {
            this.parentDataset.FullAddress = this.dwellings[0].FullAddress.split(/,(.*)/s)[1];
            const EPCs = this.dwellings.map((d) => (d.EPC ? EPCRating[d.EPC] : undefined)).filter((d) => d !== undefined);
            this.parentDataset.ParentTOID = this.dwellings[0].ParentTOID;

            this.parentDataset.EPC = this.#utilService.getMeanEPCValue(EPCs as string[]) as EPCRating;
        }
    }

    public onToggleCheckedDwellings(checked: boolean): void {
        this.dwellings.forEach((d) => {
            const isChecked = this.cardIsChecked([d]);
            if (checked !== isChecked) {
                this.toggleChecked.emit(d);
            }
        });
    }

    // sort by UPRN to get flat numbers in correct order
    public sortedDwellings(): BuildingModel[] {
        return this.dwellings.sort((a, b) => +a.UPRN - +b.UPRN);
    }
}
