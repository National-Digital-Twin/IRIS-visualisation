import { Component, input } from '@angular/core';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingHotSummerDaysDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-hot-summer-days-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './hot-summer-days-section-item.html',
    styleUrl: './hot-summer-days-section-item.scss',
})
export class HotSummerDaysSectionItem {
    public readonly warningGuidance = `
        <p>
            <strong>This property is in an area that experiences high temperatures.</strong>
            Energy efficiency improvements can increase overheating risk if ventilation and shading are not considered.
        </p>
        <p>
            Some retrofit measures, such as insulation and airtightness, may require additional design checks to maintain comfortable indoor temperatures.
        </p>
    `;

    public dataInput = input.required<BuildingHotSummerDaysDataModel>();
    public warnInput = input.required<boolean>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
