import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { ResultsCardExpandableComponent } from '@components/results-card-expandable/results-card-expandable.component';

import { DataService } from '@core/services/data.service';

import { TableRow } from '@core/models/rdf-data.model';

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
  dataService = inject(DataService);

  buildingSelection = computed(() => {
    try {
      return this.dataService.buildingsSelection();
    } catch (e) {
      console.log(e);
      return [];
    }
  });
  selectMultiple: boolean = false;

  viewDetails(building: TableRow) {
    this.dataService.setSelectedBuilding([building]);
  }
}
