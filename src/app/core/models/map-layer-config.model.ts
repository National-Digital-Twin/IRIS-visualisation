import { LayerSpecification, LayoutSpecification, PaintSpecification } from 'mapbox-gl';
export interface MapLayerConfig {
    displayName: string;
    filename: string;
    id: string;
    labelProperty: string;
    type: LayerSpecification['type'];
    layout: LayoutSpecification;
    paint?: PaintSpecification;
    paintExpression?: PaintSpecification;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
