import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { mapStateGuard } from './map-state.guard';

describe('mapStateGuard', () => {
  let router: Partial<Router>;
  let runtimeConfig: any;
  let injector: Injector;
  
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
    };

    runtimeConfig = {
      map: {
        pitch: 10,
        bearing: 20,
        center: [30, 40],
        zoom: 50,
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: RUNTIME_CONFIGURATION, useValue: runtimeConfig },
      ],
    });

    injector = TestBed.inject(Injector);
  });

  function createRoute(queryParams: any): ActivatedRouteSnapshot {
    return { queryParams } as ActivatedRouteSnapshot;
  }

  async function getGuardResult(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const guard = mapStateGuard as unknown as (
      route: ActivatedRouteSnapshot,
      state: RouterStateSnapshot
    ) => boolean;
    const result = runInInjectionContext(injector, () => guard(route, state));
    return (result as any) instanceof Promise ? await result : result;
  }

  it('should call router.navigate and return false when queryParams are missing', async () => {
    const route = createRoute({});
    const result = await getGuardResult(route, dummyState);

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

  it('should return true and not call router.navigate when at least one query param is present', async () => {
    const route = createRoute({ lat: 'someValue' });
    const result = await getGuardResult(route, dummyState);

    expect(router.navigate).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
