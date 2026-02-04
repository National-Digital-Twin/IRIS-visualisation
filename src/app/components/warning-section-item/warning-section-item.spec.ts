import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarningSectionItem } from './warning-section-item';

describe('WarningSectionItem', () => {
    let component: WarningSectionItem;
    let fixture: ComponentFixture<WarningSectionItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WarningSectionItem],
        }).compileComponents();

        fixture = TestBed.createComponent(WarningSectionItem);
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
