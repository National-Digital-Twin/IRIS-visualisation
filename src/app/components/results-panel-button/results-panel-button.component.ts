import { CommonModule } from '@angular/common';
import { Component, input, InputSignal, OnDestroy, output, OutputEmitterRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'c477-results-panel-button',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './results-panel-button.component.html',
    styleUrl: './results-panel-button.component.scss',
})
export class ResultsPanelButtonComponent implements OnDestroy {
    public panelOpen: boolean = true;

    public numberResults: InputSignal<number> = input.required();

    public updatePanelStatus: OutputEmitterRef<boolean> = output();

    public ngOnDestroy(): void {
        this.panelOpen = true;
        this.updatePanelStatus.emit(this.panelOpen);
    }

    public togglePanel(): void {
        this.panelOpen = !this.panelOpen;
        this.updatePanelStatus.emit(this.panelOpen);
    }
}
