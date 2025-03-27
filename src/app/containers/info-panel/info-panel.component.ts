import { Component, input, InputSignal } from '@angular/core';

@Component({
    selector: 'c477-info-panel',
    templateUrl: './info-panel.component.html',
    styleUrl: 'info-panel.component.scss',
    host: {
        '[class.primary]': 'indent() === 1',
        '[class.secondary]': 'indent() === 2',
        '[class.expand]': 'expanded()',
    },
})
export class InfoPanelComponent {
    public expanded: InputSignal<boolean> = input.required();
    public indent: InputSignal<number> = input(1);
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
