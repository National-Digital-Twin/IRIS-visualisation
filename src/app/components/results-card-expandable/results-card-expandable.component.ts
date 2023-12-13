import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { ResultsCardComponent } from '@components/results-card/results-card.component';
// import { ResultsCard } from '@core/models/result-card.model';
import { TableRow } from '@core/models/rdf-data.model';

@Component({
  selector: 'c477-results-card-expandable',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, ResultsCardComponent],
  templateUrl: './results-card-expandable.component.html',
  styleUrl: './results-card-expandable.component.css',
})
export class ResultsCardExpandableComponent {
  @Input() card!: TableRow;
  @Input() select: boolean = false;
}
