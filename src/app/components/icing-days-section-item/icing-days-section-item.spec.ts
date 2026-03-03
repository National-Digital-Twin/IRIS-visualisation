import { inputBinding, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BuildingIcingDaysDataModel } from '@core/models/building.weather.data.model';
import { IcingDaysSectionItem } from './icing-days-section-item';

function generateBuildingIcingDaysData(min: number, max: number): BuildingIcingDaysDataModel {
    return {
        icingDays: Math.random() * (max - min + 1) * min,
    };
}

describe('IcingDaysSectionItem', () => {
    let component: IcingDaysSectionItem;
    let fixture: ComponentFixture<IcingDaysSectionItem>;

    const dataInput = signal<BuildingIcingDaysDataModel>(generateBuildingIcingDaysData(0, 30));
    const warnInput = signal<boolean>(false);

    beforeEach(async () => {
        dataInput.set(generateBuildingIcingDaysData(0, 30));
        warnInput.set(false);

        await TestBed.configureTestingModule({
            imports: [IcingDaysSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(IcingDaysSectionItem, { bindings: [inputBinding('dataInput', dataInput), inputBinding('warnInput', warnInput)] });
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not set subtitle when warn is false', async () => {
        const subtitleElement = fixture.debugElement.query(By.css('.section-item-subtitle'));
        expect(subtitleElement).toBeFalsy();
    });

    it('should set subtitle when warn is true', async () => {
        warnInput.set(true);

        fixture.detectChanges();
        await fixture.whenStable();

        const subtitleElement = fixture.debugElement.query(By.css('.section-item-subtitle')).nativeElement;
        expect(subtitleElement.textContent).toBe('Within an area of many icing days');
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
