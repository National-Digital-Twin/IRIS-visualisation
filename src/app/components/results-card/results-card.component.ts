import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LabelComponent } from '@components/label/label.component';
import { TableRow } from '@core/models/rdf-data.model';

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
  @Input() card!: TableRow;
  @Input() select: boolean = false;
  @Output() viewDetails: EventEmitter<TableRow> = new EventEmitter<TableRow>();
}
