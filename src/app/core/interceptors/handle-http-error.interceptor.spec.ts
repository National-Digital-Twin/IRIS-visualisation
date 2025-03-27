import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ExceptionService } from '@core/services/exception.service';
import { Observable, map, of } from 'rxjs';
import { HandleHttpErrorInterceptor } from './handle-http-error.interceptor';

describe('HandleHttpErrorInterceptor', () => {
    const mockHttpEvent: HttpEvent<unknown> = { type: 0 };
    let interceptor: HandleHttpErrorInterceptor;
    let mockExceptionService: Partial<ExceptionService>;
    let mockNext: HttpHandler;
    let request: HttpRequest<unknown>;

    beforeEach(() => {
        mockExceptionService = { handleHttpError: jest.fn().mockReturnValue((source: Observable<unknown>) => source) };
        mockNext = { handle: jest.fn().mockReturnValue(of(mockHttpEvent)) };

        TestBed.configureTestingModule({
            providers: [HandleHttpErrorInterceptor, { provide: ExceptionService, useValue: mockExceptionService }],
        });

        interceptor = TestBed.inject(HandleHttpErrorInterceptor);
        request = new HttpRequest('GET', '/test');
    });

    it('should call next.handle with the provided request', (done) => {
        interceptor
            .intercept(request, mockNext)
            .pipe(
                map((event) => {
                    expect(mockNext.handle).toHaveBeenCalledWith(request);
                    expect(event).toEqual(mockHttpEvent);
                }),
            )
            .subscribe(() => done());
    });

    it('should call exceptionService.handleHttpError', (done) => {
        interceptor
            .intercept(request, mockNext)
            .pipe(
                map(() => {
                    expect(mockExceptionService.handleHttpError).toHaveBeenCalled();
                }),
            )
            .subscribe(() => done());
    });
});
