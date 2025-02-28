import { Component, input, InputSignal } from '@angular/core';

@Component({
    selector: 'c477-info-panel',
    templateUrl: './info-panel.component.html',
    styleUrl: 'info-panel.component.scss',
    host: {
        '[class.primary]': 'indent() === 1',
        '[class.secondary]': 'indent() === 2',
        '[class.expand]': 'expanded()',
    },
})
export class InfoPanelComponent {
    public expanded: InputSignal<boolean> = input.required();
    public indent: InputSignal<number> = input(1);
}
