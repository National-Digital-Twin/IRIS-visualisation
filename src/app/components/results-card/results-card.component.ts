import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { DwellingButtonsComponent } from '@components/dwelling-buttons/dwelling-buttons.component';
import { LabelComponent } from '@components/label/label.component';
import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { SignalsService } from '@core/services/signals.service';

@Component({
  selector: 'c477-results-card',
  standalone: true,
  imports: [
    CommonModule,
    DetailsPanelComponent,
    DwellingButtonsComponent,
    LabelComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './results-card.component.html',
  styleUrl: './results-card.component.css',
})
export class ResultsCardComponent {
  constructor(private signalsService: SignalsService) {}

  viewDetails(event: Event) {
    event.stopPropagation();
    this.signalsService.detailsPanelOpen.set(
      !this.signalsService.detailsPanelOpen()
    );
  }
}
