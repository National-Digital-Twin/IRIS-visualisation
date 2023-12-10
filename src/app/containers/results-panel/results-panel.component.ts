import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { ResultsCardExpandableComponent } from '@components/results-card-expandable/results-card-expandable.component';
import { ResultsCard } from '@core/models/result-card.model';

@Component({
  selector: 'c477-results-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    ResultsCardComponent,
    ResultsCardExpandableComponent,
  ],
  templateUrl: './results-panel.component.html',
  styleUrl: './results-panel.component.scss',
})
export class ResultsPanelComponent {
  selectMultiple: boolean = false;
  cardData: ResultsCard[] = [
    {
      name: '11 High st',
      Address: '11 High St, Newport PO30 1ZZ',
      SAPBand: 'D',
      PropertyType: 'House',
      flagged: true,
    },
    {
      name: 'Dolphin Holiday Apartment',
      Address: 'The Dolphin, 49 Quay St, Sea St, Newport PO30 5BA',
      SAPBand: 'C',
      PropertyType: 'Flat',
      flagged: false,
      dwellings: [
        {
          name: 'Flat 1',
          Address: 'Flat 1, The Dolphin, 49 Quay St, Sea St, Newport PO30 5BA',
          SAPBand: 'D',
          PropertyType: 'Flat',
          flagged: false,
        },
        {
          name: 'Flat 3',
          Address: 'Flat 3, The Dolphin, 49 Quay St, Sea St, Newport PO30 5BA',
          SAPBand: 'C',
          PropertyType: 'Flat',
          flagged: false,
        },
        {
          name: 'Flat 3',
          Address: 'Flat 3, The Dolphin, 49 Quay St, Sea St, Newport PO30 5BA',
          SAPBand: 'B',
          PropertyType: 'Flat',
          flagged: false,
        },
      ],
    },
  ];
}
