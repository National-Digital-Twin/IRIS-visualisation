import { TestBed } from '@angular/core/testing';
import { FilterService } from './filter.service';

describe('FilterService', () => {
    let service: FilterService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [FilterService],
        });

        service = TestBed.inject(FilterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('createFilterString', () => {
        it('should create a filter string from a new filter only', () => {
            const newFilter = { EPC: ['C', 'G'] };
            const result = service.createFilterString(newFilter);
            expect(result).toBe('EPC-C-G');
        });

        it('should merge a new filter with current filters and remove duplicate values', () => {
            const newFilter = { BuiltForm: ['SemiDetached'] };
            const currentFilters = { BuiltForm: ['EndTerrace'], EPC: ['A'] };
            const result = service.createFilterString(newFilter, currentFilters);

            expect(result).toMatch(
                /(BuiltForm-(SemiDetached|EndTerrace)-(SemiDetached|EndTerrace):EPC-A)|(EPC-A:BuiltForm-(SemiDetached|EndTerrace)-(SemiDetached|EndTerrace))/,
            );

            const parts = result.split(':');
            expect(parts.length).toBe(2);
        });

        it('should handle an empty currentFilters object', () => {
            const newFilter = { StructureUnitType: ['Bungalow'] };
            const result = service.createFilterString(newFilter, {});
            expect(result).toBe('StructureUnitType-Bungalow');
        });
    });

    describe('parseFilterString', () => {
        it('should parse a filter string into a FilterProps object', () => {
            const filterStr = 'EPC-C-G:BuiltForm-SemiDetached-EndTerrace:StructureUnitType-Bungalow';
            const parsed = service.parseFilterString(filterStr);
            expect(parsed).toEqual({
                EPC: ['C', 'G'],
                BuiltForm: ['SemiDetached', 'EndTerrace'],
                StructureUnitType: ['Bungalow'],
            });
        });

        it('should combine values if the same key appears more than once', () => {
            const filterStr = 'EPC-C-G:EPC-A';
            const parsed = service.parseFilterString(filterStr);
            expect(parsed).toEqual({
                EPC: ['C', 'G', 'A'],
            });
        });
    });

    describe('integration between create and parse', () => {
        it('should be reversible: parsing a created filter string returns equivalent filter values', () => {
            const newFilter = { EPC: ['C', 'G'], BuiltForm: ['SemiDetached'] };
            const filterStr = service.createFilterString(newFilter);
            const parsed = service.parseFilterString(filterStr);

            Object.keys(newFilter).forEach((key) => {
                const typedKey = key as keyof typeof newFilter;
                expect(new Set(parsed[typedKey])).toEqual(new Set(newFilter[typedKey]));
            });
        });
    });
});
