import { CamelCaseSpacePipe } from './camel-case-space.pipe';

describe('CamelCaseSpacePipe', () => {
    let pipe: CamelCaseSpacePipe;

    beforeEach(() => {
        pipe = new CamelCaseSpacePipe();
    });

    it('should add a space between a lowercase letter and an uppercase letter', () => {
        const input = 'helloWorld';
        const result = pipe.transform(input);
        expect(result).toBe('hello World');
    });

    it('should add a space between "2002" and an uppercase letter', () => {
        const input = '2002Hello';
        const result = pipe.transform(input);
        expect(result).toBe('2002 Hello');
    });

    it('should add a space between a lowercase letter and "2002"', () => {
        const input = 'hello2002';
        const result = pipe.transform(input);
        expect(result).toBe('hello 2002');
    });

    it('should return the original string if no transformation is needed', () => {
        const input = 'HELLO';
        const result = pipe.transform(input);
        expect(result).toBe('HELLO');
    });
});
