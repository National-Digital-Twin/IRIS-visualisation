import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'number', standalone: true })
export class NumberPipe implements PipeTransform {
    public transform(original: number, decimals: number = 0): string {
        if (original === 0) {
            return '0';
        }

        if (!isFinite(original)) {
            return '-';
        }

        const isNegative = original < 0;
        const absValue = Math.abs(original);

        let result: string;

        if (absValue < 10000) {
            if (decimals > 0) {
                result = absValue.toFixed(decimals);
            } else {
                result = Math.round(absValue).toString();
            }
        } else if (absValue < 1000000) {
            const thousands = absValue / 1000;
            if (decimals > 0) {
                result = thousands.toFixed(decimals) + 'k';
            } else {
                result = Math.round(thousands) + 'k';
            }
        } else {
            const millions = absValue / 1000000;
            if (decimals > 0) {
                result = millions.toFixed(decimals) + 'm';
            } else {
                result = Math.round(millions) + 'm';
            }
        }

        return isNegative ? '-' + result : result;
    }
}
