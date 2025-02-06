import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'c477-label',
    imports: [CommonModule],
    templateUrl: './label.component.html',
})
export class LabelComponent {
    @Input() public epcRating?: string;
    @Input() public sapPoints?: string;
    @Input() public expired?: boolean = false;
}
