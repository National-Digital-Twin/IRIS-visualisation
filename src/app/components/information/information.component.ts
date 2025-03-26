import { CommonModule } from '@angular/common';
import { Component, Renderer2, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'c477-information',
    imports: [CommonModule, MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, MatIconModule],
    templateUrl: './information.component.html',
    styleUrl: './information.component.scss',
})
export class InformationComponent {
    readonly #renderer = inject(Renderer2);

    public downloadUserGuide(): void {
        const link = this.#renderer.createElement('a');
        link.setAttribute('target', '_self');
        link.setAttribute('href', 'assets/C477 - IRIS user guide v2.pdf');
        link.setAttribute('download', `C477 - IRIS user guide v2.pdf`);
        link.click();
        link.remove();
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
