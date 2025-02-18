import { TestBed } from '@angular/core/testing';
import { PosthogService } from './posthog.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '@environment';
import { posthog } from 'posthog-js';

jest.mock('posthog-js', () => ({
  posthog: {
    capture: jest.fn(),
    init: jest.fn(),
  },
}));

describe('PosthogService', () => {
  let service: PosthogService;
  let routerEvents$: Subject<any>;
  let fakeRouter: Partial<Router>;

  beforeEach(() => {
    // Simulate production mode for these tests.
    (environment as any).production = true;
    (environment as any).posthog = { apiKey: 'test-api-key' };

    routerEvents$ = new Subject();
    fakeRouter = { events: routerEvents$.asObservable() };

    TestBed.configureTestingModule({
      providers: [
        PosthogService,
        { provide: Router, useValue: fakeRouter },
      ],
    });

    service = TestBed.inject(PosthogService);
    (posthog.capture as jest.Mock).mockClear();
    (posthog.init as jest.Mock).mockClear();
  });

  it('should capture pageview on NavigationEnd event in production', () => {
    const navEnd = new NavigationEnd(1, '/test', '/test');
    routerEvents$.next(navEnd);
    expect(posthog.capture).toHaveBeenCalledWith('$pageview');
  });

  it('should initialize posthog in production', () => {
    service.initialize();
    expect(posthog.init).toHaveBeenCalledWith('test-api-key', {
      api_host: 'https://eu.posthog.com',
      capture_pageview: false,
    });
  });

  it('should capture custom event in production', () => {
    service.capture('custom-event', { prop: 'value' });
    expect(posthog.capture).toHaveBeenCalledWith('custom-event', { prop: 'value' });
  });

  describe('when not in production', () => {
    beforeEach(() => {
      // Override production flag.
      (environment as any).production = false;
    });

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
