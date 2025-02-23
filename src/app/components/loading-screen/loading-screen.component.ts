import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'c477-loading-screen',
    imports: [CommonModule, MatProgressBarModule],
    templateUrl: './loading-screen.component.html',
})
export class LoadingScreenComponent {}
