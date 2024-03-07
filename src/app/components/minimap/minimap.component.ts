import { Component, Input, inject, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { skip } from 'rxjs';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { MinimapData } from '@core/models/minimap-data.model';

@Component({
  selector: 'c477-minimap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minimap.component.html',
  styleUrl: './minimap.component.css',
})
export class MinimapComponent implements OnInit, OnChanges {
  map?: mapboxgl.Map;
  @Input() minimapData?: MinimapData;
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private readonly theme = inject(SettingsService).get(SETTINGS.Theme);
  public readonly theme$ = toObservable(this.theme).pipe(takeUntilDestroyed());
  private arrow: string = 'arrow-dark';
  data = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: this.runtimeConfig.map.center },
    properties: {},
  } as Feature<Geometry, GeoJsonProperties>;

  ngOnInit(): void {
    if (
      this.runtimeConfig.map.style &&
      this.runtimeConfig.map.center &&
      this.runtimeConfig.minimap.zoom &&
      environment.mapbox.apiKey
    ) {
      const accessToken = environment.mapbox.apiKey;
      const apiKey = environment.os.apiKey;
      const theme = this.theme();
      this.arrow = theme === 'dark' ? 'arrow-light' : 'arrow-dark';
      this.map = new mapboxgl.Map({
        accessToken,
        container: 'minimap',
        style: this.runtimeConfig.map.style[theme],
        zoom: this.runtimeConfig.minimap.zoom,
        center: this.runtimeConfig.map.center,
        interactive: false,
        attributionControl: false,
        // append OS api key and srs details to OS VTS requests
        transformRequest: (url: string) => {
          if (url.indexOf('api.os.uk') > -1) {
            if (!/[?&]key=/.test(url)) url += '?key=' + apiKey;
            return {
              url: url + '&srs=3857',
            };
          } else {
            return {
              url: url,
            };
          }
        },
      });

      this.map.on('style.load', async () => {
        this.map?.loadImage('assets/Arrow_dark.png', (error, image) => {
          if (image) {
            this.map?.addImage('arrow-dark', image);
          }
        });
        this.map?.loadImage('assets/Arrow_light.png', (error, image) => {
          if (image) {
            this.map?.addImage('arrow-light', image);
          }
        });
        this.map?.addSource('centerpoint', {
          type: 'geojson',
          data: this.data,
        });
        this.map?.addLayer({
          id: 'centerpoint',
          type: 'symbol',
          source: 'centerpoint',
          layout: {
            'icon-image': this.arrow,
            'icon-size': 0.5,
          },
        });
        if (this.map && this.minimapData) {
          this.setArrowPosition();
        }
      });
    }

    /* skip first value as we've already set the map style based on theme */
    this.theme$.pipe(skip(1)).subscribe(theme => {
      this.arrow = theme === 'dark' ? 'arrow-light' : 'arrow-dark';
      this.map?.setStyle(this.runtimeConfig.map.style[theme]);
    });
  }

  setArrowPosition() {
    if (this.map && this.minimapData) {
      (this.map.getSource('centerpoint') as GeoJSONSource)?.setData({
        ...this.data,
        geometry: {
          ...this.data.geometry,
          coordinates: [
            // @ts-expect-error because the type is incorrect for coordinates
            this.minimapData.position.lng,
            // @ts-expect-error because the type is incorrect for coordinates
            this.minimapData.position.lat,
          ],
        },
      });
      this.map.setLayoutProperty(
        'centerpoint',
        'icon-rotate',
        this.minimapData.bearing
      );
    }
  }

  ngOnChanges(): void {
    if (this.map && this.minimapData) {
      this.map.flyTo({
        center: this.minimapData.position,
        zoom: this.runtimeConfig.minimap.zoom,
      });
    }
    this.setArrowPosition();
  }
}
