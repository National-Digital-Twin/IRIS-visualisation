import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '@components/label/label.component';

@Component({
    selector: 'c477-legend',
    imports: [CommonModule, LabelComponent],
    templateUrl: './legend.component.html',
    styleUrl: './legend.component.scss',
})
export class LegendComponent {
    public epcItems = [
        { rating: 'A', sapPoints: '92 +' },
        { rating: 'B', sapPoints: '81-91' },
        { rating: 'C', sapPoints: '69-80' },
        { rating: 'D', sapPoints: '55-68' },
        { rating: 'E', sapPoints: '39-54' },
        { rating: 'F', sapPoints: '21-38' },
        { rating: 'G', sapPoints: '1-20' },
        { rating: 'none', sapPoints: '' },
        { rating: 'avg', sapPoints: '1-20' },
    ];
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
