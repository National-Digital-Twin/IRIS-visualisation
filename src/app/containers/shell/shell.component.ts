import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Polygon } from 'geojson';

import { MapComponent } from '@components/map/map.component';
import { SpatialQueryService } from '@core/services/spatial-query.service';

@Component({
  selector: 'c477-shell',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent {
  spatialQueryService = inject(SpatialQueryService);
  title = 'C477 Visualisation';

  setSearchArea(searchArea: GeoJSON.Feature<Polygon>) {
    this.spatialQueryService.selectBuildings(searchArea);
  }

  setSelectedBuildingTOID(selectedBuilding: string | null) {
    if (selectedBuilding) {
      this.spatialQueryService.setSelectedTOID(selectedBuilding);
      this.spatialQueryService.selectBuilding(selectedBuilding);
    }
  }
}
