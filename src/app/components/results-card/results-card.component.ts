import { NgClass } from '@angular/common';
import { Component, InputSignal, OutputEmitterRef, Signal, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { LabelComponent } from '@components/label/label.component';
import { BuildingModel } from '@core/models/building.model';
import { DownloadBuilding } from '@core/models/download-data-warning.model';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { UtilService } from '@core/services/utils.service';
import { Theme } from '@core/types/theme';

@Component({
    selector: 'c477-results-card[card]',
    imports: [NgClass, LabelComponent, MatButtonModule, MatCheckboxModule, MatIconModule],
    templateUrl: './results-card.component.html',
    styleUrl: './results-card.component.scss',
    host: {
        '[class.parent]': 'parent()',
        '[class.selected]': 'card().UPRN === buildingUPRN()',
        '(click)': 'onClick($event)',
    },
})
export class ResultsCardComponent {
    readonly #dialog: MatDialog = inject(MatDialog);
    readonly #theme: Signal<Theme> = inject(SettingsService).get(SETTINGS.Theme);
    readonly #utilService: UtilService = inject(UtilService);

    public buildingUPRN: InputSignal<string | undefined> = input();
    public card: InputSignal<BuildingModel> = input.required();
    public checked: InputSignal<boolean> = input(false);
    public parent: InputSignal<boolean> = input(false);
    public select: InputSignal<boolean> = input(false);

    public cardSelected: OutputEmitterRef<BuildingModel> = output();
    public downloadData: OutputEmitterRef<DownloadBuilding> = output();
    public emitViewDetails: OutputEmitterRef<BuildingModel> = output();
    public flag: OutputEmitterRef<void> = output();
    public removeFlag: OutputEmitterRef<void> = output();
    public toggleChecked: OutputEmitterRef<boolean> = output();

    get theme(): Signal<Theme> {
        return this.#theme;
    }

    public getAddressSegment(index: number): string {
        const card = this.card();
        return this.#utilService.splitAddress(index, card.FullAddress);
    }

    public epcExpired(): boolean {
        const card = this.card();
        return this.#utilService.epcExpired(card.InspectionDate);
    }

    public openDownloadWarning(): void {
        const card = this.card();

        this.#dialog
            .open(DownloadWarningComponent, {
                panelClass: 'data-download',
                data: {
                    addresses: [card.FullAddress],
                },
            })
            .afterClosed()
            .subscribe((download) => {
                if (download) {
                    this.downloadData.emit({ building: card, format: download });
                }
            });
    }

    public viewDetails($event: Event): void {
        $event.stopPropagation();

        const card = this.card();
        this.emitViewDetails.emit(card);
    }

    public onClick($event: MouseEvent): void {
        $event.stopPropagation();

        const card = this.card();
        this.cardSelected.emit(card);
    }
}
