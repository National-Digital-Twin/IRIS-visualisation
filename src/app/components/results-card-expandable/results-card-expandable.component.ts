import {
  Component,
  inject,
  Input,
  OnChanges,
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

  parentDataset: BuildingModel = {
    FullAddress: '',
    EPC: undefined,
    PostCode: undefined,
    UPRN: '',
    Flagged: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dwellings) {
      this.parentDataset.FullAddress =
        this.dwellings[0].FullAddress.split(/,(.*)/s)[1];
      const EPCs = this.dwellings
        .map(d => (d.EPC ? EPCRating[d.EPC] : undefined))
        .filter(d => d !== undefined);

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
