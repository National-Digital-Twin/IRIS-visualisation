import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AreaLevel, AreaSelectionDialogResult } from '../../core/models/area-filter.model';
import { AreaSelectionService } from '../../core/services/area-selection.service';

@Component({
    selector: 'c477-area-filter-panel',
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        ScrollingModule,
    ],
    templateUrl: './area-filter-panel.component.html',
    styleUrl: './area-filter-panel.component.scss',
})
export class AreaFilterPanelComponent {
    readonly #areaService = inject(AreaSelectionService);

    @Output() public canceled = new EventEmitter<void>();
    @Output() public confirm = new EventEmitter<AreaSelectionDialogResult>();

    protected areaLevel = signal<AreaLevel | null>(null);
    protected allAreas = signal<string[]>([]);
    protected searchTerm = signal<string>('');
    protected selectedAreas = signal<Set<string>>(new Set());
    protected loading = signal<boolean>(false);

    protected filteredAreas = computed(() => {
        const search = this.searchTerm().toLowerCase();
        const areas = this.allAreas();
        return search ? areas.filter((a) => a.toLowerCase().includes(search)) : areas;
    });

    protected selectedAreasArray = computed(() => Array.from(this.selectedAreas()));
    protected selectionCount = computed(() => this.selectedAreas().size);
    protected maxSelections = computed(() => {
        const level = this.areaLevel();
        if (level === 'region') return 10;
        return 15;
    });
    protected isAtLimit = computed(() => this.selectionCount() >= this.maxSelections());
    protected hasAreaLevelSelected = computed(() => this.areaLevel() !== null);

    protected onAreaLevelChange(): void {
        this.selectedAreas.set(new Set());
        this.searchTerm.set('');
        const level = this.areaLevel();
        if (level) {
            this.loadAreas();
        }
    }

    protected loadAreas(): void {
        const level = this.areaLevel();
        if (!level) return;

        this.loading.set(true);
        this.#areaService.getAreasByLevel(level).subscribe({
            next: (areas) => {
                this.allAreas.set(areas);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    protected onSelectionChange(area: string, checked: boolean): void {
        const current = new Set(this.selectedAreas());
        const max = this.maxSelections();
        if (checked && current.size < max) {
            current.add(area);
        } else if (!checked) {
            current.delete(area);
        }
        this.selectedAreas.set(current);
    }

    protected removeSelectedArea(area: string): void {
        const current = new Set(this.selectedAreas());
        current.delete(area);
        this.selectedAreas.set(current);
    }

    protected onConfirm(): void {
        const level = this.areaLevel();
        if (level && this.selectionCount() > 0) {
            this.confirm.emit({
                level: level,
                names: Array.from(this.selectedAreas()),
            });
        }
    }

    protected onCancel(): void {
        this.reset();
        this.canceled.emit();
    }

    protected reset(): void {
        this.areaLevel.set(null);
        this.selectedAreas.set(new Set());
        this.searchTerm.set('');
        this.allAreas.set([]);
        this.loading.set(false);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
