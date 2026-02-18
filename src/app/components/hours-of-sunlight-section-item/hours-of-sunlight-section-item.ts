import { Component, input } from '@angular/core';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingSunlightHoursDataModel } from '@core/models/building.weather.data.model';

@Component({
    selector: 'c477-hours-of-sunlight-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './hours-of-sunlight-section-item.html',
    styleUrl: './hours-of-sunlight-section-item.scss',
})
export class HoursOfSunlightSectionItem {
    public dataInput = input.required<BuildingSunlightHoursDataModel>();
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
