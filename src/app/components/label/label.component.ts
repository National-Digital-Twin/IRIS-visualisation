import { Component, computed, input, InputSignal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'c477-label',
    imports: [MatIcon],
    templateUrl: './label.component.html',
    styleUrl: './label.component.scss',
    host: {
        '[class]': 'clazz()',
        '[class.expired]': 'expired()',
    },
})
export class LabelComponent {
    public epcRating: InputSignal<string | undefined> = input();
    public sapPoints: InputSignal<string | undefined> = input();
    public expired: InputSignal<boolean> = input(false);

    public clazz = computed(() => `epc-rating-${this.epcRating()?.toLowerCase()}`);
}
