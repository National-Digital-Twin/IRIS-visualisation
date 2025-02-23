import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { AdvancedFilter } from '@core/models/advanced-filters.model';
import { PascalCaseSpacePipe } from '@core/pipes/pascal-case-space.pipe';

type MultiFilterControlValue<T extends AdvancedFilter> = T[] | null;

@Component({
    selector: 'c477-multi-button-filter[title][options]',
    imports: [CommonModule, MatButtonToggleModule, PascalCaseSpacePipe],
    templateUrl: './multi-button-filter.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MultiButtonFilterComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MultiButtonFilterComponent),
            multi: true,
        },
    ],
})
export class MultiButtonFilterComponent<T extends AdvancedFilter> implements ControlValueAccessor {
    @Input() public options!: string[];
    @Input() public title!: string;
    @Input() public validOptions?: string[];

    public selectedValues?: string[];

    public hasChange: (selectedValues: MultiFilterControlValue<T>) => void = (): void => {};
    public isTouched: () => void = (): void => {};

    public registerOnChange(fn: () => void): void {
        this.hasChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this.isTouched = fn;
    }

    public filterChange(e: MatButtonToggleChange): void {
        this.isTouched();
        this.selectedValues = e.value;
        this.hasChange(this.selectedValues as unknown as MultiFilterControlValue<T>);
    }

    public writeValue(value: MultiFilterControlValue<T> | null): void {
        if (value) {
            this.selectedValues = value as unknown as string[];
        } else {
            this.selectedValues = [];
        }
    }
}
