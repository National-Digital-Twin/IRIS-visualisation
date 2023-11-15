import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { DataService } from '@core/services/data.service';

import { MapComponent } from 'src/app/components/map/map.component';
import { MapConfigModel } from '@core/models/map-configuration.model';

@Component({
  selector: 'c477-shell',
  standalone: true,
  providers: [DataService],
  imports: [CommonModule, MapComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent implements OnInit {
  dataService = inject(DataService);
  router = inject(Router);
  runtimeConfig = inject(RUNTIME_CONFIGURATION);

  title = 'C477 Visualisation';

  // TODO - remove, this is for testing purposes only
  ngOnInit(): void {
    this.dataService.getUPRNs().subscribe(data => console.log(data));
  }

  setRouteParams(params: MapConfigModel) {
    const { bearing, lat, lng, pitch, zoom } = params;
    this.router.navigate(['/'], {
      queryParams: { bearing, lat, lng, pitch, zoom },
    });
  }
}
