import { CdkAccordionModule } from '@angular/cdk/accordion';
import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { GuidanceSectionItem } from '@components/guidance-section-item/guidance-section-item';
import { HotSummerDaysSectionItem } from '@components/hot-summer-days-section-item/hot-summer-days-section-item';
import { HoursOfSunlightSectionItem } from '@components/hours-of-sunlight-section-item/hours-of-sunlight-section-item';
import { IcingDaysSectionItem } from '@components/icing-days-section-item/icing-days-section-item';
import { WindDrivenRainSectionItem } from '@components/wind-driven-rain-section-item/wind-driven-rain-section-item';

@Component({
    selector: 'c477-more-info-section',
    imports: [
        MatDividerModule,
        CdkAccordionModule,
        WindDrivenRainSectionItem,
        IcingDaysSectionItem,
        HotSummerDaysSectionItem,
        HoursOfSunlightSectionItem,
        GuidanceSectionItem,
    ],
    templateUrl: './more-info-section.html',
    styleUrl: './more-info-section.scss',
})
export class MoreInfoSection {}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
