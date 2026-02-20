import { Component, input } from '@angular/core';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingWindDrivenRainDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-wind-driven-rain-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './wind-driven-rain-section-item.html',
    styleUrl: './wind-driven-rain-section-item.scss',
})
export class WindDrivenRainSectionItem {
    public readonly warningGuidance = `
        <p>
            <strong>This property is within an area with elevated wind-driven rain exposure under current and projected climate conditions.</strong>
        </p>
        <p>
            Wind-driven rain increases moisture loading on exposed walls and roofs. In higher-exposure areas, some retrofit measures — particularly cavity wall
            insulation, internal wall insulation, external wall insulation and airtightness improvements — may require enhanced moisture risk assessment and
            detailing to avoid unintended damp or condensation risks.
        </p>
        <p>
            This flag reflects area-level climate exposure, not confirmed defects at this property.
        </p>
        <p>
            A <a href="https://www.bsigroup.com/en-GB/insights-and-media/insights/brochures/pas-2035-retrofitting-dwellings-for-improved-energy-efficiency/" target="_blank">PAS 2035</a> - compliant assessment should consider local exposure and wall construction before installation.
        </p>
    `;

    public dataInput = input.required<BuildingWindDrivenRainDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
