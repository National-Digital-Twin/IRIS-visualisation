import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotSummerDaysSectionItem } from './hot-summer-days-section-item';

describe('HotSummerDaysSectionItem', () => {
    let component: HotSummerDaysSectionItem;
    let fixture: ComponentFixture<HotSummerDaysSectionItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HotSummerDaysSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(HotSummerDaysSectionItem);
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
