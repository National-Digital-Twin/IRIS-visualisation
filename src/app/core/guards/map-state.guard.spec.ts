import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { mapStateGuard } from './map-state.guard';

const runtimeConfig = {
    map: {
        pitch: 10,
        bearing: 20,
        center: [30, 40],
        zoom: 50,
    },
};

describe('mapStateGuard', () => {
    const router = { navigate: jest.fn().mockReturnValue(Promise.resolve(true)) };
    let injector: Injector;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: Router, useValue: router },
                { provide: RUNTIME_CONFIGURATION, useValue: runtimeConfig },
            ],
        });

        injector = TestBed.inject(Injector);
    });

    afterEach(() => router.navigate.mockClear());

    function createRoute(queryParams: Record<string, string>): ActivatedRouteSnapshot {
        return { queryParams } as ActivatedRouteSnapshot;
    }

    function getGuardResult(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const guard = mapStateGuard as unknown as (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => boolean;
        return runInInjectionContext(injector, () => guard(route, state));
    }

    it('should call router.navigate and return false when queryParams are missing', () => {
        const route = createRoute({});
        const mockState = {} as RouterStateSnapshot;
        const result = getGuardResult(route, mockState);

        expect(router.navigate).toHaveBeenCalledWith(['/'], {
            queryParams: {
                bearing: runtimeConfig.map.bearing,
                lat: runtimeConfig.map.center[0],
                lng: runtimeConfig.map.center[1],
                pitch: runtimeConfig.map.pitch,
                zoom: runtimeConfig.map.zoom,
            },
            queryParamsHandling: 'merge',
        });
        expect(result).toBe(false);
    });

    it('should return true and not call router.navigate when at least one query param is present', () => {
        const route = createRoute({ lat: 'someValue' });
        const mockState = {} as RouterStateSnapshot;
        const result = getGuardResult(route, mockState);

        expect(router.navigate).not.toHaveBeenCalled();
        expect(result).toBe(true);
    });
});
