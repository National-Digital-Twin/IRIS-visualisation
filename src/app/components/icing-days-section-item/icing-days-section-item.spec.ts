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

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IcingDaysSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(IcingDaysSectionItem);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not create the data table when no data is provided', async () => {
        const dataTableElement = fixture.debugElement.query(By.css('.data-table'));
        expect(dataTableElement).toBeFalsy();
    });

    it('should create the data table when data is provided', async () => {
        component.data = generateBuildingIcingDaysData(0, 30);

        fixture.detectChanges();
        await fixture.whenStable();

        const dataTableElement = fixture.debugElement.query(By.css('.data-table')).nativeElement;
        expect(dataTableElement).toBeTruthy();
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
