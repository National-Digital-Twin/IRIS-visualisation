import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MinimapData } from '@core/models/minimap-data.model';
import { MapService } from '@core/services/map.service';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import { skip } from 'rxjs';

@Component({
    selector: 'c477-minimap',
    imports: [CommonModule],
    templateUrl: './minimap.component.html',
})
export class MinimapComponent implements OnInit, OnChanges {
    readonly #mapService = inject(MapService);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);
    readonly #theme = inject(SettingsService).get(SETTINGS.Theme);

    public theme$ = toObservable(this.#theme).pipe(takeUntilDestroyed());

    private map?: mapboxgl.Map;
    private arrow: string = 'arrow-dark';
    private readonly data: Feature<Geometry, GeoJsonProperties>;

    @Input() public minimapData?: MinimapData;

    constructor() {
        this.data = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: this.#runtimeConfig.map.center },
            properties: {},
        };
    }

    public ngOnChanges(): void {
        if (this.map && this.minimapData) {
            this.map.flyTo({
                center: this.minimapData.position,
                zoom: this.#runtimeConfig.minimap.zoom,
            });
        }
        this.setArrowPosition();
    }

    public ngOnInit(): void {
        if (this.#runtimeConfig.map.style && this.#runtimeConfig.map.center && this.#runtimeConfig.minimap.zoom) {
            const theme = this.#theme();
            this.arrow = theme === 'dark' ? 'arrow-light' : 'arrow-dark';
            this.map = new mapboxgl.Map({
                container: 'minimap',
                accessToken: 'undefined',
                zoom: this.#runtimeConfig.minimap.zoom,
                center: this.#runtimeConfig.map.center,
                interactive: false,
                attributionControl: false,
                style: this.#runtimeConfig.map.style[theme],
                // append OS api key and srs details to OS VTS requests
                transformRequest: (url: string): Record<'url', string> => {
                    if (url.indexOf('api.os.uk') > -1) {
                        url = this.#mapService.transformUrlForProxy(url, 'api.os.uk', 'os', 'key');
                        url = url.endsWith('?') ? url + 'srs=3857' : url + '?srs=3857';
                    } else if (url.indexOf('api.mapbox.com') > -1) {
                        url = this.#mapService.transformUrlForProxy(url, 'api.mapbox.com', 'mapbox-api', 'access_token');
                    } else if (url.indexOf('events.mapbox.com') > -1) {
                        url = this.#mapService.transformUrlForProxy(url, 'events.mapbox.com', 'mapbox-events', 'access_token');
                    }
                    return {
                        url: url,
                    };
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
        this.theme$.pipe(skip(1)).subscribe((theme) => {
            this.arrow = theme === 'dark' ? 'arrow-light' : 'arrow-dark';
            this.map?.setStyle(this.#runtimeConfig.map.style[theme]);
        });
    }

    private setArrowPosition(): void {
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
            this.map.setLayoutProperty('centerpoint', 'icon-rotate', this.minimapData.bearing);
        }
    }
}
