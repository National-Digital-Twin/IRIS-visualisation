import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { ResultsCardExpandableComponent } from '@components/results-card-expandable/results-card-expandable.component';

import { DataService } from '@core/services/data.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';

import { BuildingModel } from '@core/models/building.model';
import { MapService } from '@core/services/map.service';

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
  private dataService = inject(DataService);
  private spatialQueryService = inject(SpatialQueryService);
  private mapService = inject(MapService);

  buildingSelection = this.dataService.buildingsSelection;

  selectMultiple: boolean = false;

  selectedBuildingUPRN?: number;

  /**
   * View Details button handler
   * @param building selected building
   */
  viewDetails(building: BuildingModel) {
    /** Set UPRN to load data from API */
    this.dataService.setSelectedUPRN(+building.UPRN);
    /** Set UPRN to highlight card in results list */
    this.selectedBuildingUPRN = +building.UPRN;
    const TOID = building.TOID ? building.TOID : building.ParentTOID;
    /** set TOID to highlight building on map */
    this.spatialQueryService.setSelectedTOID(TOID!);
    this.spatialQueryService.selectBuilding(TOID!, false);
    /** get building geom to zoom map */
    this.zoomToBuilding(TOID!);
  }

  /**
   * Single dwelling results card handler
   * @param selectedBuilding building for selected card
   */
  selectBuilding(selectedBuilding: BuildingModel) {
    /**
     * if selected card building uprn === the current selected card uprn
     * deselect card and building
     */
    if (this.selectedBuildingUPRN === +selectedBuilding.UPRN) {
      /** deselect card */
      this.selectedBuildingUPRN = undefined;
      /** deselect building on map */
      this.spatialQueryService.setSelectedTOID('');
      this.spatialQueryService.selectBuilding('', false);
      /** close details panel */
      this.dataService.setSelectedUPRN(undefined);
      this.dataService.setSelectedBuilding(undefined);
    } else {
      this.selectedBuildingUPRN = +selectedBuilding.UPRN;
      const TOID = selectedBuilding.TOID
        ? selectedBuilding.TOID
        : selectedBuilding.ParentTOID;
      this.spatialQueryService.setSelectedTOID(TOID!);
      this.spatialQueryService.selectBuilding(TOID!, false);
    }
  }

  zoomToBuilding(TOID: string) {
    const geomBB = this.spatialQueryService.getFeatureGeomBB(TOID);
    if (geomBB) {
      this.mapService.zoomToCoords([
        geomBB.getCenter().lng - 0.0005,
        geomBB.getCenter().lat,
      ]);
    }
  }
}
