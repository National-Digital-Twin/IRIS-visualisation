import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PosthogService } from '@core/services/posthog.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let posthogServiceMock: jest.Mocked<PosthogService>;

    beforeEach(async () => {
        posthogServiceMock = { initialize: jest.fn() } as unknown as jest.Mocked<PosthogService>;

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [{ provide: PosthogService, useValue: posthogServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize posthog on init', () => {
        expect(posthogServiceMock.initialize).toHaveBeenCalled();
    });
});
