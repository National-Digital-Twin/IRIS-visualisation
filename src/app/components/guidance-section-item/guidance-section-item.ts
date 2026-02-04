import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WarningSectionItem } from '@components/warning-section-item/warning-section-item';

@Component({
    selector: 'c477-guidance-section-item',
    imports: [WarningSectionItem, MatIconModule],
    templateUrl: './guidance-section-item.html',
    styleUrl: './guidance-section-item.scss',
})
export class GuidanceSectionItem {}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
