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
import {
  Floor,
  FloorInsulation,
  Roof,
  RoofInsulation,
  Wall,
} from '@core/enums';

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

  @Output() closePanel: EventEmitter<null> = new EventEmitter();

  buildingDetails = this.dataService.selectedBuilding;
  buildingParts = this.dataService.parts;

  addressPart1 = this.buildingDetails()?.fullAddress.split(',')[0];
  addressPart2 = this.buildingDetails()?.fullAddress.split(',')[1];
  floor: { [key: string]: string } = Floor;
  floorInsulation: { [key: string]: string } = FloorInsulation;
  roof: { [key: string]: string } = Roof;
  roofInsulation: { [key: string]: string } = RoofInsulation;
  wall: { [key: string]: string } = Wall;
}
