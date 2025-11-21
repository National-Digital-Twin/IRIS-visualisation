import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, Input, input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'c477-area-selector',
    imports: [CommonModule, MatFormFieldModule, MatSelectModule],
    template: `
        <mat-form-field appearance="outline" class="inline-select">
            <mat-select multiple [value]="selectedAreas" (selectionChange)="onSelectionChange($event.value)" [placeholder]="pluralLabel()">
                <mat-select-trigger>{{ pluralLabel() }}</mat-select-trigger>
                @for (area of availableAreas; track area) {
                    <mat-option [value]="area" [disabled]="selectedAreas.length === 1 && selectedAreas.includes(area)">
                        {{ area }}
                    </mat-option>
                }
            </mat-select>
        </mat-form-field>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaSelectorComponent {
    public label = input<string>('area');
    @Input() public selectedAreas: string[] = [];
    @Input() public availableAreas: string[] = [];
    @Output() public selectedAreasChange = new EventEmitter<string[]>();

    protected readonly pluralLabel = computed(() => {
        const singular = this.label();
        return singular === 'county' ? 'counties' : `${singular}s`;
    });

    public onSelectionChange(areas: string[]): void {
        this.selectedAreasChange.emit(areas);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
