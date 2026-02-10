import { Component, Input } from '@angular/core';
import { MoreInfoSectionItem } from '@components/more-info-section-item/more-info-section-item';
import { BuildingWindDrivenRainData } from '@core/services/climate-data.service';

@Component({
    selector: 'c477-wind-driven-rain-section-item',
    imports: [MoreInfoSectionItem],
    templateUrl: './wind-driven-rain-section-item.html',
    styleUrl: './wind-driven-rain-section-item.scss',
})
export class WindDrivenRainSectionItem {
    @Input() public data: BuildingWindDrivenRainData | null = null;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
