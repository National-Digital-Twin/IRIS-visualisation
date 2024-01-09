import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LabelComponent } from '@components/label/label.component';
import { BuildingModel } from '@core/models/building.model';

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
  @Input() card!: BuildingModel;
  @Input() select: boolean = false;
  @Output() viewDetails: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();

  getAddressSegment(index: number) {
    return this.card?.FullAddress.split(',')[index];
  }
}
