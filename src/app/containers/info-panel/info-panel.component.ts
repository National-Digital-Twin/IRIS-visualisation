import { Component, input, InputSignal } from '@angular/core';

@Component({
    selector: 'c477-info-panel',
    templateUrl: './info-panel.component.html',
    styleUrl: 'info-panel.component.scss',
    host: {
        '[class.expand]': 'expanded()',
    },
})
export class InfoPanelComponent {
    public expanded: InputSignal<boolean> = input.required();
}
