import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { LabelComponent } from '@components/label/label.component';
import { DataService } from '@core/services/data.service';

@Component({
  selector: 'c477-details-panel',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './details-panel.component.html',
  styleUrl: './details-panel.component.scss',
})
export class DetailsPanelComponent {
  dataService = inject(DataService);

  buildingDetails = this.dataService.selectedBuilding;

  @Output() closePanel: EventEmitter<null> = new EventEmitter();

  addressPart1 = this.buildingDetails()?.fullAddress.split(',')[0];
  addressPart2 = this.buildingDetails()?.fullAddress.split(',')[1];
}
