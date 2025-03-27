import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'c477-loading-screen',
    imports: [CommonModule, MatProgressBarModule],
    templateUrl: './loading-screen.component.html',
    styleUrl: './loading-screen.component.scss',
})
export class LoadingScreenComponent {}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
