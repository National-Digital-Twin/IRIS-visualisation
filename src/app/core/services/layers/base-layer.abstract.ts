import { Injectable, inject } from '@angular/core';
import { MAP_SERVICE } from '@core/services/map.token';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { BaseLayer } from './base-layer.interface';

@Injectable()
export abstract class AbstractBaseLayer implements BaseLayer {
    protected readonly mapService = inject(MAP_SERVICE);

    public abstract readonly id: string;

    public isVisible: boolean = false;

    private static layerFactory: any = null;

    public static setLayerFactory(factory: any): void {
        AbstractBaseLayer.layerFactory = factory;
    }

    public abstract getLayerConfig(): LayerSpecification;
    public abstract getSourceData(): FeatureCollection<Geometry, GeoJsonProperties> | Promise<FeatureCollection<Geometry, GeoJsonProperties>>;

    public show(): void {
        if (!this.isVisible) {
            this.hideAllOtherLayers();

            this.isVisible = true;
            this.addLayerToMap();
        }
    }

    private hideAllOtherLayers(): void {
        if (AbstractBaseLayer.layerFactory) {
            const allLayers = AbstractBaseLayer.layerFactory.getAllLayers();
            allLayers.forEach((layer: BaseLayer) => {
                if (layer.id !== this.id && layer.isVisible) {
                    layer.hide();
                }
            });
        }
    }

    public hide(): void {
        if (this.isVisible) {
            this.isVisible = false;
            this.removeLayerFromMap();
        }
    }

    protected async addLayerToMap(): Promise<void> {
        try {
            const sourceData = await this.getSourceData();
            const layerConfig = this.getLayerConfig();

            if (layerConfig.source) {
                this.mapService.addMapSource(layerConfig.source, {
                    type: 'geojson',
                    data: sourceData,
                });

                this.mapService.addMapLayer(layerConfig);

                if (this.onLayerClick) {
                    this.mapService.mapInstance.on('click', layerConfig.id, this.onLayerClick.bind(this));
                }
            }
        } catch (error) {
            console.error(`Failed to add layer ${this.id}:`, error);
        }
    }

    protected removeLayerFromMap(): void {
        const layerConfig = this.getLayerConfig();
        if (layerConfig.source) {
            this.mapService.mapInstance.removeLayer(this.id);
            this.mapService.mapInstance.removeSource(layerConfig.source);
        }
    }

    public onLayerClick?(event: MapMouseEvent): void;
}
