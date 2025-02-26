import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, InputSignal, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MinimapData } from '@core/models/minimap-data.model';
import { MapService } from '@core/services/map.service';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import mapboxgl, { GeoJSONSource, Map } from 'mapbox-gl';
import { skip } from 'rxjs';

@Component({
    selector: 'c477-minimap',
    imports: [CommonModule],
    templateUrl: './minimap.component.html',
    styleUrl: './minimap.component.scss',
})
export class MinimapComponent implements OnInit {
    readonly #mapService = inject(MapService);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);
    readonly #theme = inject(SettingsService).get(SETTINGS.Theme);

    public theme$ = toObservable(this.#theme).pipe(takeUntilDestroyed());

    private arrow: string = 'arrow-dark';
    private readonly map: WritableSignal<Map | undefined> = signal(undefined);
    private readonly data: Feature<Geometry, GeoJsonProperties>;

    public minimapData: InputSignal<MinimapData | undefined> = input();

    constructor() {
        this.data = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: this.#runtimeConfig.map.center },
            properties: {},
        };

        effect(() => {
            const map = this.map();
            const minimapData = this.minimapData();

            if (map && minimapData) {
                map.flyTo({ center: minimapData.position, zoom: this.#runtimeConfig.minimap.zoom });
            }

            this.setArrowPosition();
        });
    }

    public ngOnInit(): void {
        if (this.#runtimeConfig.map.style && this.#runtimeConfig.map.center && this.#runtimeConfig.minimap.zoom) {
            const theme = this.#theme();
            this.arrow = theme === 'dark' ? 'arrow-light' : 'arrow-dark';

            const map = new mapboxgl.Map({
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

            map.on('style.load', async ({ target: map }) => {
                map.loadImage('assets/images/Arrow_dark.png', (error, image) => {
                    if (!image) {
                        return;
                    }
                    map.addImage('arrow-dark', image);
                });

                map.loadImage('assets/images/Arrow_light.png', (error, image) => {
                    if (!image) {
                        return;
                    }
                    map.addImage('arrow-light', image);
                });

                map.addSource('centerpoint', {
                    type: 'geojson',
                    data: this.data,
                });

                map.addLayer({
                    id: 'centerpoint',
                    type: 'symbol',
                    source: 'centerpoint',
                    layout: {
                        'icon-image': this.arrow,
                        'icon-size': 0.5,
                    },
                });

                this.map.set(map);
            });

            map.on('error', (error) => console.log('[MINIMAP]', 'Map Error', { error }));
            map.on('styleimagemissing', (error) => console.log('[MINIMAP]', 'Image Missing', { error }));
        }

        /* skip first value as we've already set the map style based on theme */
        this.theme$.pipe(skip(1)).subscribe((theme) => {
            const map = this.map();

            if (!map) {
                return;
            }

            this.arrow = theme === 'dark' ? 'arrow-light' : 'arrow-dark';
            map.setStyle(this.#runtimeConfig.map.style[theme]);
        });
    }

    private setArrowPosition(): void {
        const map = this.map();
        const minimapData = this.minimapData();

        if (map && minimapData) {
            const source = map.getSource('centerpoint') as GeoJSONSource;

            if (!source) {
                return;
            }

            source.setData({
                ...this.data,
                geometry: {
                    ...this.data.geometry,
                    coordinates: [
                        // @ts-expect-error because the type is incorrect for coordinates
                        minimapData.position.lng,
                        // @ts-expect-error because the type is incorrect for coordinates
                        minimapData.position.lat,
                    ],
                },
            });
            map.setLayoutProperty('centerpoint', 'icon-rotate', minimapData.bearing);
        }
    }
}
