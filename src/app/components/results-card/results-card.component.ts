import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { LabelComponent } from '@components/label/label.component';

import { UtilService } from '@core/services/utils.service';

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
  private utilService = inject(UtilService);

  @HostListener('click', ['$event'])
  onClick($event: MouseEvent) {
    $event.stopPropagation();
    this.selectCard();
  }

  @Input() card!: BuildingModel;
  @Input() buildingUPRN?: number;
  @Input() select: boolean = false;
  @Output() emitViewDetails: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();
  @Output() selectBuilding: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();

  getAddressSegment(index: number) {
    return this.utilService.splitAddress(index, this.card?.FullAddress);
  }

  selectCard() {
    this.selectBuilding.emit(this.card);
  }

  viewDetails($event: Event) {
    $event.stopPropagation();
    this.emitViewDetails.emit(this.card);
  }
}
