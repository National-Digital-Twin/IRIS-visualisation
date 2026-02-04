import { CdkAccordionModule } from '@angular/cdk/accordion';
import { Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

let idCounter = 0;

@Component({
    selector: 'c477-warning-section-item',
    imports: [CdkAccordionModule, MatIconModule, MatDividerModule],
    templateUrl: './warning-section-item.html',
    styleUrl: './warning-section-item.scss',
})
export class WarningSectionItem {
    @Input() public header: string = '';
    @Input() public subtitle?: string;
    public id: string = `warning-section-item-${idCounter++}`;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
