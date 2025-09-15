import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStateService {
    public showLegend = signal<boolean>(false);
    public showLayersAndControls = signal<boolean>(true);

    public closeLegend(): void {
        this.showLegend.set(false);
    }

    public toggleLegend(): void {
        this.showLegend.update((current) => !current);
    }

    public setLayersAndControlsVisibility(visible: boolean): void {
        this.showLayersAndControls.set(visible);
    }
}
