import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'c477-results-panel-button',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './results-panel-button.component.html',
})
export class ResultsPanelButtonComponent implements OnDestroy {
    public panelOpen: boolean = true;

    @Input() public numberResults!: number;

    @Output() public updatePanelStatus = new EventEmitter<boolean>();

    public ngOnDestroy(): void {
        this.panelOpen = true;
        this.updatePanelStatus.emit(this.panelOpen);
    }

    public togglePanel(): void {
        this.panelOpen = !this.panelOpen;
        this.updatePanelStatus.emit(this.panelOpen);
    }
}
