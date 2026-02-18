import { inputBinding, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BuildingHotSummerDaysDataModel } from '@core/models/building.weather.data.model';
import { HotSummerDaysSectionItem } from './hot-summer-days-section-item';

function generateBuildingHotSummerDaysData(min: number, max: number): BuildingHotSummerDaysDataModel {
    return {
        baselineMedian: Math.random() * (max - min + 1) + min,
        degreesAboveBaselineMedian: new Map([
            [1.5, Math.random() * (max - min + 1) + min],
            [2, Math.random() * (max - min + 1) + min],
            [2.5, Math.random() * (max - min + 1) + min],
            [3, Math.random() * (max - min + 1) + min],
            [4, Math.random() * (max - min + 1) + min],
        ]),
    };
}

describe('HotSummerDaysSectionItem', () => {
    let component: HotSummerDaysSectionItem;
    let fixture: ComponentFixture<HotSummerDaysSectionItem>;

    const dataInput = signal<BuildingHotSummerDaysDataModel>(generateBuildingHotSummerDaysData(0, 25));
    const warnInput = signal<boolean>(false);

    beforeEach(async () => {
        dataInput.set(generateBuildingHotSummerDaysData(0, 25));
        warnInput.set(false);

        await TestBed.configureTestingModule({
            imports: [HotSummerDaysSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(HotSummerDaysSectionItem, { bindings: [inputBinding('dataInput', dataInput), inputBinding('warnInput', warnInput)] });
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not set subtitle when warn is false', () => {
        const subtitleElement = fixture.debugElement.query(By.css('.section-item-subtitle'));
        expect(subtitleElement).toBeFalsy();
    });

    it('should set subtitle when warn is true', async () => {
        warnInput.set(true);

        fixture.detectChanges();
        await fixture.whenStable();

        const subtitleElement = fixture.debugElement.query(By.css('.section-item-subtitle')).nativeElement;
        expect(subtitleElement.textContent).toBe('Within an area of many hot summer days');
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
