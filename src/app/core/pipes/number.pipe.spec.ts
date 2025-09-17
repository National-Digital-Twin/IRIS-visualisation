import { NumberPipe } from './number.pipe';

describe('NumberPipe', () => {
    let pipe: NumberPipe;

    beforeEach(() => {
        pipe = new NumberPipe();
    });

    describe('Basic functionality', () => {
        it('should create an instance', () => {
            expect(pipe).toBeTruthy();
        });

        it('should handle zero', () => {
            expect(pipe.transform(0)).toBe('0');
        });

        it('should handle negative zero', () => {
            expect(pipe.transform(-0)).toBe('0');
        });

        it('should handle invalid numbers', () => {
            expect(pipe.transform(NaN)).toBe('-');
            expect(pipe.transform(Infinity)).toBe('-');
            expect(pipe.transform(-Infinity)).toBe('-');
        });
    });

    describe('Numbers under 10,000', () => {
        it('should keep numbers under 10,000 as-is', () => {
            expect(pipe.transform(356)).toBe('356');
            expect(pipe.transform(5396)).toBe('5396');
            expect(pipe.transform(9999)).toBe('9999');
            expect(pipe.transform(1)).toBe('1');
            expect(pipe.transform(100)).toBe('100');
        });

        it('should handle negative numbers under 10,000', () => {
            expect(pipe.transform(-356)).toBe('-356');
            expect(pipe.transform(-5396)).toBe('-5396');
            expect(pipe.transform(-9999)).toBe('-9999');
        });

        it('should apply decimal places for numbers under 10,000', () => {
            expect(pipe.transform(356.789, 2)).toBe('356.79');
            expect(pipe.transform(1234.567, 1)).toBe('1234.6');
            expect(pipe.transform(9999.999, 3)).toBe('9999.999');
        });

        it('should not apply decimal places when decimals parameter is 0', () => {
            expect(pipe.transform(356.789, 0)).toBe('357');
            expect(pipe.transform(1234.567, 0)).toBe('1235');
        });
    });

    describe('Numbers 10,000 to 999,999', () => {
        it('should convert to thousands with k suffix', () => {
            expect(pipe.transform(10174)).toBe('10k');
            expect(pipe.transform(27734)).toBe('28k');
            expect(pipe.transform(20452)).toBe('20k');
            expect(pipe.transform(10000)).toBe('10k');
            expect(pipe.transform(999999)).toBe('1000k');
        });

        it('should handle negative numbers in thousands range', () => {
            expect(pipe.transform(-10174)).toBe('-10k');
            expect(pipe.transform(-27734)).toBe('-28k');
            expect(pipe.transform(-20452)).toBe('-20k');
        });

        it('should round correctly for thousands', () => {
            expect(pipe.transform(10500)).toBe('11k');
            expect(pipe.transform(10499)).toBe('10k');
            expect(pipe.transform(15500)).toBe('16k');
            expect(pipe.transform(15499)).toBe('15k');
        });

        it('should apply decimal places for thousands when specified', () => {
            expect(pipe.transform(10174, 2)).toBe('10.17k');
            expect(pipe.transform(27734, 1)).toBe('27.7k');
            expect(pipe.transform(20452, 1)).toBe('20.5k');
        });
    });

    describe('Numbers 1,000,000 and above', () => {
        it('should convert to millions with m suffix', () => {
            expect(pipe.transform(531525)).toBe('532k');
            expect(pipe.transform(1000000)).toBe('1m');
            expect(pipe.transform(2561562)).toBe('3m');
            expect(pipe.transform(63313441)).toBe('63m');
        });

        it('should handle negative numbers in millions range', () => {
            expect(pipe.transform(-1000000)).toBe('-1m');
            expect(pipe.transform(-63313441)).toBe('-63m');
        });

        it('should round correctly for millions', () => {
            expect(pipe.transform(1500000)).toBe('2m');
            expect(pipe.transform(1499999)).toBe('1m');
            expect(pipe.transform(2500000)).toBe('3m');
        });

        it('should apply decimal places for millions when specified', () => {
            expect(pipe.transform(1000000, 2)).toBe('1.00m');
            expect(pipe.transform(63313441, 1)).toBe('63.3m');
            expect(pipe.transform(2561562, 2)).toBe('2.56m');
        });
    });

    describe('Edge cases and boundary values', () => {
        it('should handle exact boundary values', () => {
            expect(pipe.transform(9999)).toBe('9999');
            expect(pipe.transform(10000)).toBe('10k');
            expect(pipe.transform(999999)).toBe('1000k');
            expect(pipe.transform(1000000)).toBe('1m');
        });

        it('should handle very large numbers', () => {
            expect(pipe.transform(1000000000)).toBe('1000m');
            expect(pipe.transform(999999999)).toBe('1000m');
        });

        it('should handle decimal inputs correctly', () => {
            expect(pipe.transform(356.0)).toBe('356');
            expect(pipe.transform(10174.0)).toBe('10k');
            expect(pipe.transform(1000000.0)).toBe('1m');
        });
    });

    describe('Decimal places parameter', () => {
        it('should default to 0 decimal places', () => {
            expect(pipe.transform(123.456)).toBe('123');
            expect(pipe.transform(1234.567)).toBe('1235');
        });

        it('should apply decimal places to all number ranges', () => {
            expect(pipe.transform(123.456, 2)).toBe('123.46');
            expect(pipe.transform(1234.567, 1)).toBe('1234.6');
            expect(pipe.transform(9999.999, 3)).toBe('9999.999');
            expect(pipe.transform(10174, 2)).toBe('10.17k');
            expect(pipe.transform(1000000, 2)).toBe('1.00m');
        });

        it('should apply decimal places to all ranges when specified', () => {
            expect(pipe.transform(10174, 2)).toBe('10.17k');
            expect(pipe.transform(1000000, 3)).toBe('1.000m');
        });

        it('should handle zero decimal places explicitly', () => {
            expect(pipe.transform(123.456, 0)).toBe('123');
            expect(pipe.transform(10174, 0)).toBe('10k');
            expect(pipe.transform(1000000, 0)).toBe('1m');
        });
    });
});
