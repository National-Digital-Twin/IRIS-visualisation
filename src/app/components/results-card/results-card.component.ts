import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, Signal, inject } from '@angular/core';
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
    imports: [CommonModule, LabelComponent, MatButtonModule, MatCheckboxModule, MatIconModule],
    templateUrl: './results-card.component.html',
})
export class ResultsCardComponent {
    readonly #dialog: MatDialog = inject(MatDialog);
    readonly #theme: Signal<Theme> = inject(SettingsService).get(SETTINGS.Theme);
    readonly #utilService: UtilService = inject(UtilService);

    @Input() public buildingUPRN?: string;
    @Input() public card!: BuildingModel;
    @Input() public checked: boolean = false;
    @Input() public parent: boolean = false;
    @Input() public select: boolean = false;

    @Output() public cardSelected: EventEmitter<BuildingModel> = new EventEmitter<BuildingModel>();
    @Output() public downloadData: EventEmitter<DownloadBuilding> = new EventEmitter<DownloadBuilding>();
    @Output() public emitViewDetails: EventEmitter<BuildingModel> = new EventEmitter<BuildingModel>();
    @Output() public flag = new EventEmitter<void>();
    @Output() public removeFlag = new EventEmitter<void>();
    @Output() public toggleChecked = new EventEmitter<boolean>();

    get theme(): Signal<Theme> {
        return this.#theme;
    }

    public getAddressSegment(index: number): string {
        return this.#utilService.splitAddress(index, this.card?.FullAddress);
    }

    public epcExpired(): boolean {
        return this.#utilService.epcExpired(this.card.InspectionDate);
    }

    public openDownloadWarning(): void {
        this.#dialog
            .open(DownloadWarningComponent, {
                panelClass: 'data-download',
                data: {
                    addresses: [this.card?.FullAddress],
                },
            })
            .afterClosed()
            .subscribe((download) => {
                if (download) {
                    this.downloadData.emit({ building: this.card, format: download });
                }
            });
    }

    private selectCard(): void {
        this.cardSelected.emit(this.card);
    }

    public viewDetails($event: Event): void {
        $event.stopPropagation();
        this.emitViewDetails.emit(this.card);
    }

    @HostListener('click', ['$event'])
    public onClick($event: MouseEvent): void {
        $event.stopPropagation();
        this.selectCard();
    }
}
