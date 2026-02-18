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
            <strong>This property is within an area that experiences high levels of wind-driven rain under projected future climate conditions.</strong>
            Increased moisture exposure can affect walls, roofs and external elements.
        </p>
        <p>
            Some retrofit measures, particularly insulation or airtightness improvements, may increase damp risk without appropriate design. Additional checks
            are recommended before installation.
        </p>
    `;

    public dataInput = input.required<BuildingWindDrivenRainDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
