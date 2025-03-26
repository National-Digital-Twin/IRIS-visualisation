import { AnyLayer, AnyLayout, AnyPaint } from 'mapbox-gl';
export interface MapLayerConfig {
    displayName: string;
    filename: string; // name of geojson file
    id: string;
    labelProperty: string; // feature label property
    type: AnyLayer['type']; // mapbox gl layer type
    layout: AnyLayout;
    paint?: AnyPaint;
    paintExpression?: AnyPaint;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
