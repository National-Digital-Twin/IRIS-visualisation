import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarningSection } from './warning-section';

describe('WarningSection', () => {
    let component: WarningSection;
    let fixture: ComponentFixture<WarningSection>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WarningSection],
        }).compileComponents();

        fixture = TestBed.createComponent(WarningSection);
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
