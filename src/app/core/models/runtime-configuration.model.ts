import { MapLayerFilter } from '@core/models/layer-filter.model';
import { URLStateModel } from '@core/models/url-state.model';
import { MapLayerId } from '@core/types/map-layer-id';
import { Theme } from '@core/types/theme';
import { LayerSpecification } from 'mapbox-gl';
import { MapLayerConfig } from './map-layer-config.model';

type Layer = LayerSpecification & { filter: MapLayerFilter & { layerId: MapLayerId } };

export interface RuntimeConfigurationModel {
    /* Application is in production */
    production: boolean;
    /* Appliation environment */
    env: 'local' | 'dev' | 'prod';
    /** Address search configuration */
    addressSearch: {
        localCustodianCode: number;
        maxResults: number;
    };
    cache: {
        epc: string;
        sap: string;
        nonEpc: string;
    };
    /* Mapbox minimap config */
    minimap: {
        zoom: number;
    };
    /* Mapbox map config */
    map: URLStateModel & { style: Record<Theme, string> };
    /* Mapbox map layers */
    mapLayers: Layer[];
    /** EPC Colours */
    epcColours: Record<string, string>;
    /** EPC Colours - Colour Deficient*/
    epcColoursCD: Record<string, string>;
    /* Company logo */
    companyLogo: Record<Theme, string>;
    /* Map context layers */
    contextLayers: MapLayerConfig[];
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
