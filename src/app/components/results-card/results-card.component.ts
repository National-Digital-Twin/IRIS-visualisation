import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LabelComponent } from '@components/label/label.component';
import { SignalsService } from '@core/services/signals.service';

@Component({
  selector: 'c477-results-card',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './results-card.component.html',
  styleUrl: './results-card.component.css',
})
export class ResultsCardComponent {
  private signalsService = inject(SignalsService);

  viewDetails(event: Event) {
    event.stopPropagation();
    this.signalsService.detailsPanelOpen.set(true);
  }
}
