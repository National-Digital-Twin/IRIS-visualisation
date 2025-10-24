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
                result = this.fixedPointString(absValue, decimals, '');
            } else {
                result = Math.round(absValue).toString();
            }
        } else if (absValue < 1000000) {
            const thousands = absValue / 1000;
            if (decimals > 0) {
                result = this.fixedPointString(thousands, decimals, 'k');
            } else {
                result = Math.round(thousands) + 'k';
            }
        } else {
            const millions = absValue / 1000000;
            if (decimals > 0) {
                result = this.fixedPointString(millions, decimals, 'm');
            } else {
                result = Math.round(millions) + 'm';
            }
        }

        return isNegative ? '-' + result : result;
    }

    private fixedPointString(num: number, decimals: number, ordinal: string): string {
        if (num % 1 === 0) {
            return `${Math.trunc(num).toString()}${ordinal}`;
        }

        const fixedNum = num.toFixed(decimals);

        if (fixedNum.includes('.')) {
            const allZerosAfterDecimalPoint = /\.?0+$/;

            if (allZerosAfterDecimalPoint.test(fixedNum)) {
                return `${fixedNum.replace(allZerosAfterDecimalPoint, '')}${ordinal}`;
            }
        }

        return `${num.toFixed(decimals)}${ordinal}`;
    }
}
