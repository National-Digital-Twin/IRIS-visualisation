import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { BuildingModel } from '@core/models/building.model';
import { UtilService } from '@core/services/utils.service';
import { EPCRating } from '@core/enums';

@Component({
  selector: 'c477-results-card-expandable',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, ResultsCardComponent],
  templateUrl: './results-card-expandable.component.html',
  styleUrl: './results-card-expandable.component.css',
})
export class ResultsCardExpandableComponent implements OnChanges {
  private utilService = inject(UtilService);
  @Input() dwellings!: BuildingModel[];
  @Input() select: boolean = false;
  @Input() buildingTOID?: string;
  @Output() cardSelected: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();
  @Output() emitViewDetails: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();

  parentDataset: BuildingModel = {
    BuildForm: undefined,
    EPC: undefined,
    FullAddress: '',
    InspectionDate: undefined,
    ParentTOID: '',
    PostCode: undefined,
    PropertyType: undefined,
    UPRN: '',
    Flagged: undefined,
    YearOfAssessment: undefined,
    FloorConstruction: undefined,
    FloorInsulation: undefined,
    RoofConstruction: undefined,
    RoofInsulationThickness: undefined,
    RoofInsulationLocation: undefined,
    WallConstruction: undefined,
    WallInsulation: undefined,
    WindowGlazing: undefined,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dwellings) {
      this.parentDataset.FullAddress =
        this.dwellings[0].FullAddress.split(/,(.*)/s)[1];
      const EPCs = this.dwellings
        .map(d => (d.EPC ? EPCRating[d.EPC] : undefined))
        .filter(d => d !== undefined);
      this.parentDataset.ParentTOID = this.dwellings[0].ParentTOID;

      this.parentDataset.EPC = this.utilService.getMeanEPCValue(
        EPCs as string[]
      ) as EPCRating;
    }
  }

  // sort by UPRN to get flat numbers in correct order
  sortedDwellings(): BuildingModel[] {
    return this.dwellings.sort((a, b) => +a.UPRN - +b.UPRN);
  }
}
