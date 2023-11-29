import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ResultsCardComponent } from '@components/results-card/results-card.component';

@Component({
  selector: 'c477-results-card-expandable',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, ResultsCardComponent],
  templateUrl: './results-card-expandable.component.html',
  styleUrl: './results-card-expandable.component.css',
})
export class ResultsCardExpandableComponent {
  cardData = {
    building_name: 'Building 1',
    dwellings: [
      {
        building_name: 'Dwelling 1',
      },
      {
        building_name: 'Dwelling 2',
      },
    ],
  };
}
