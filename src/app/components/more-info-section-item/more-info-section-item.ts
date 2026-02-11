import { CdkAccordionModule } from '@angular/cdk/accordion';
import { Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'c477-more-info-section-item',
    imports: [CdkAccordionModule, MatIconModule, MatDividerModule],
    templateUrl: './more-info-section-item.html',
    styleUrl: './more-info-section-item.scss',
})
export class MoreInfoSectionItem {
    @Input() public header: string = '';
    @Input() public subtitle?: string;
    @Input() public warn: boolean = false;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
