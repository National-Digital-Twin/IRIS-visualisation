import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResultsCardComponent } from '@components/results-card/results-card.component';

@Component({
  selector: 'c477-results-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, ResultsCardComponent],
  templateUrl: './results-panel.component.html',
  styleUrl: './results-panel.component.scss',
})
export class ResultsPanelComponent {}
