import { Injectable, NgZone } from '@angular/core';

import { AsyncSubject, Observable } from 'rxjs';
import { first } from 'rxjs/operators';

// eslint-disable-next-line
// @ts-ignore
import { MapEvent, Map as MapboxMap } from '!mapbox-gl';
import { MapConfig } from '@core/models/runtime-configuration.model';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  mapInstance: MapboxMap;
  mapCreated$: Observable<void>;
  mapLoaded$: Observable<void>;
  mapEvents: MapEvent;

  private mapCreated = new AsyncSubject<void>();
  private mapLoaded = new AsyncSubject<void>();

  constructor(private zone: NgZone) {
    this.mapCreated$ = this.mapCreated.asObservable();
    this.mapLoaded$ = this.mapLoaded.asObservable();
  }

  setup(config: MapConfig) {
    // Need onStable to wait for a potential @angular/route transition to end
    this.zone.onStable.pipe(first()).subscribe(() => {
      this.createMap(config);
      this.hookEvents();
      this.mapCreated.next(undefined);
      this.mapCreated.complete();
    });
  }

  private createMap(config: MapConfig) {
    NgZone.assertNotInAngularZone();
    const { center, pitch, zoom, style } = config;

    const accessToken = environment.mapbox.apiKey;

    this.mapInstance = new MapboxMap({
      container: 'map',
      accessToken,
      pitch,
      zoom,
      center,
      style,
    });
  }

  private hookEvents() {
    this.mapInstance.on('load', () => {
      this.mapLoaded.next(undefined);
      this.mapLoaded.complete();
    });
  }
}
