import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DownloadDataWarningData } from '@core/models/download-data-warning.model';

@Component({
    selector: 'c477-download-warning',
    imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, MatIconModule],
    templateUrl: './download-warning.component.html',
    styleUrl: './download-warning.component.scss',
})
export class DownloadWarningComponent {
    readonly #data = inject<DownloadDataWarningData>(MAT_DIALOG_DATA);

    get data(): DownloadDataWarningData {
        return this.#data;
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
