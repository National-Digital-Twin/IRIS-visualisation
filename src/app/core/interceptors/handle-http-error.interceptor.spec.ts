import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpEvent, HttpHandler } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { HandleHttpErrorInterceptor } from './handle-http-error.interceptor';
import { ExceptionService } from '@core/services/exception.service';

describe('HandleHttpErrorInterceptor', () => {
  let interceptor: HandleHttpErrorInterceptor;
  let fakeExceptionService: Partial<ExceptionService>;
  let fakeNext: HttpHandler;
  let request: HttpRequest<any>;
  const fakeHttpEvent: HttpEvent<any> = { type: 0 };

  beforeEach(() => {
    fakeExceptionService = {
      handleHttpError: jest.fn().mockReturnValue((source$: Observable<any>) => source$)
    };

    fakeNext = {
      handle: jest.fn().mockReturnValue(of(fakeHttpEvent))
    };

    TestBed.configureTestingModule({
      providers: [
        HandleHttpErrorInterceptor,
        { provide: ExceptionService, useValue: fakeExceptionService }
      ]
    });

    interceptor = TestBed.inject(HandleHttpErrorInterceptor);
    request = new HttpRequest('GET', '/test');
  });

  it('should call next.handle with the provided request', (done) => {
    interceptor.intercept(request, fakeNext).subscribe((event) => {
      expect(fakeNext.handle).toHaveBeenCalledWith(request);
      expect(event).toEqual(fakeHttpEvent);
      done();
    });
  });

  it('should call exceptionService.handleHttpError', (done) => {
    interceptor.intercept(request, fakeNext).subscribe(() => {
      expect(fakeExceptionService.handleHttpError).toHaveBeenCalled();
      done();
    });
  });
});
