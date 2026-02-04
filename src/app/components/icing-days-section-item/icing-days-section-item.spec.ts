import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IcingDaysSectionItem } from './icing-days-section-item';

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
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
