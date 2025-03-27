import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '@environment';
import { posthog } from 'posthog-js';
import { Subject } from 'rxjs';
import { PosthogService } from './posthog.service';

jest.mock('posthog-js', () => ({
    posthog: {
        capture: jest.fn(),
        init: jest.fn(),
    },
}));

describe('PosthogService', () => {
    const router = { events: new Subject<NavigationEnd>() };
    let service: PosthogService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PosthogService, { provide: Router, useValue: router }],
        });

        service = TestBed.inject(PosthogService);
        (posthog.capture as jest.Mock).mockClear();
        (posthog.init as jest.Mock).mockClear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('when in production', () => {
        beforeEach(() => {
            environment.production = true;
            environment.posthog = { apiKey: 'test-api-key' };
        });

        it('should capture pageview on NavigationEnd event in production', () => {
            const event = new NavigationEnd(1, '/test', '/test');
            router.events.next(event);
            expect(posthog.capture).toHaveBeenCalledWith('$pageview');
        });

        it('should initialize posthog in production', () => {
            service.initialize();
            expect(posthog.init).toHaveBeenCalledWith('test-api-key', {
                api_host: 'https://eu.posthog.com',
                capture_pageview: false,
            });
        });
    });

    describe('when not in production', () => {
        beforeEach(() => (environment.production = false));

        it('should not initialize posthog when not in production', () => {
            service.initialize();
            expect(posthog.init).not.toHaveBeenCalled();
        });

        it('should not capture custom event when not in production', () => {
            service.capture('custom-event', { prop: 'value' });
            expect(posthog.capture).not.toHaveBeenCalled();
        });
    });
});
