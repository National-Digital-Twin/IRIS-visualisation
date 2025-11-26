// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'c477-chart-placeholder',
    imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './chart-placeholder.component.html',
    styleUrl: './chart-placeholder.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPlaceholderComponent {
    /** Error to display. If set, shows error state; if null/undefined, shows loading state. */
    public error = input<HttpErrorResponse | null>(null);

    /** Callback for retry button. If not provided, retry button is hidden. */
    public onRetry = input<(() => void) | null>(null);

    public readonly errorMessage = computed(() => {
        const err = this.error();
        if (!err) {
            return null;
        }

        if (err.status === 504 || err.error?.error === 'QueryCanceledError') {
            return 'Request timed out';
        }
        return 'An error occurred while loading the chart';
    });
}
