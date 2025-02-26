import { CommonModule } from '@angular/common';
import { Component, InputSignal, WritableSignal, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormControlName } from '@angular/forms';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { PascalCaseSpacePipe } from '@core/pipes/pascal-case-space.pipe';

@Component({
    selector: 'c477-multi-button-filter[title][options]',
    imports: [CommonModule, MatButtonToggleModule, PascalCaseSpacePipe],
    templateUrl: './multi-button-filter.component.html',
    styleUrl: './multi-button-filter.component.scss',
})
export class MultiButtonFilterComponent implements ControlValueAccessor {
    readonly #input = inject(FormControlName);

    public title: InputSignal<string> = input.required();
    public options: InputSignal<string[]> = input.required();
    public validOptions: InputSignal<string[]> = input<string[]>([]);

    public disabled: WritableSignal<boolean> = signal(false);
    public selectedValues: WritableSignal<string[]> = signal([]);

    public hasChange: (value: string[]) => void = (): void => {};
    public isTouched: () => void = (): void => {};

    constructor() {
        this.#input.valueAccessor = this;
    }

    public registerOnChange(fn: () => void): void {
        this.hasChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this.isTouched = fn;
    }

    public setDisabledState(disabled: boolean): void {
        this.disabled.set(disabled);
    }

    public filterChange(event: MatButtonToggleChange): void {
        this.isTouched();
        this.selectedValues.set(event.value);
        this.hasChange(this.selectedValues());
    }

    public writeValue(value: string[]): void {
        if (value) {
            this.selectedValues.set(value);
        } else {
            this.selectedValues.set([]);
        }
    }
}
