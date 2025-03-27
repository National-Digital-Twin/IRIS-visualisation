import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { ExceptionService } from './exception.service';

describe('ExceptionService', () => {
    let service: ExceptionService;
    let consoleErrorSpy: jest.SpyInstance;
    let snackBarSpy: { open: jest.Mock };
    let mockDocument: { location: { reload: jest.Mock } };

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        snackBarSpy = { open: jest.fn(() => ({ afterDismissed: (): Observable<unknown> => of(null) })) };
        mockDocument = { location: { reload: jest.fn() } };

        TestBed.configureTestingModule({
            providers: [ExceptionService, { provide: MatSnackBar, useValue: snackBarSpy }, { provide: DOCUMENT, useValue: mockDocument }],
        });

        service = TestBed.inject(ExceptionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('handleError', () => {
        it('should log the error to the console', () => {
            const error = new Error('Test error');
            service.handleError(error);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('handleHttpError', () => {
        it('should handle a 5xx HTTP error', (done) => {
            const httpError = new HttpErrorResponse({
                url: 'https://fake-api-url/transparent-proxy',
                status: HttpStatusCode.InternalServerError,
                error: { message: 'Internal Server Error' },
            });

            throwError(() => httpError)
                .pipe(
                    service.handleHttpError(),
                    catchError((err) => of(err)),
                    map((err) => expect(err).toEqual(new Error('Server error 500: Internal Server Error'))),
                )
                .subscribe(() => done());
        });

        [HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden].forEach((statusCode) =>
            it('should handle an 401 HTTP error', (done) => {
                const httpError = new HttpErrorResponse({
                    url: 'https://fake-api-url/transparent-proxy',
                    status: statusCode,
                    error: { message: 'Session expired' },
                });

                throwError(() => httpError)
                    .pipe(
                        service.handleHttpError(),
                        catchError(() => of(null)),
                        map(() =>
                            expect(snackBarSpy.open).toHaveBeenCalledWith('Your session has expired. Please login again.', 'Ok', {
                                duration: 0,
                                politeness: 'assertive',
                            }),
                        ),
                        map(() => expect(mockDocument.location.reload).toHaveBeenCalled()),
                    )
                    .subscribe(() => done());
            }),
        );
    });
});
