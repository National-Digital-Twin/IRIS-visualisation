import { TestBed } from '@angular/core/testing';
import { ExceptionService } from './exception.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DOCUMENT } from '@angular/common';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

describe('ExceptionService', () => {
  let service: ExceptionService;
  let snackBarSpy: { open: jest.Mock };
  let fakeDocument: { location: { reload: jest.Mock } };
  let runtimeConfig: { apiURL: string };

  beforeEach(() => {
    snackBarSpy = {
      open: jest.fn(() => ({
        afterDismissed: () => of(null),
      })),
    };
    
    fakeDocument = {
      location: {
        reload: jest.fn(),
      },
    };

    runtimeConfig = { apiURL: 'http://fake-api-url' };

    TestBed.configureTestingModule({
      providers: [
        ExceptionService,
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: DOCUMENT, useValue: fakeDocument },
        { provide: RUNTIME_CONFIGURATION, useValue: runtimeConfig },
      ],
    });

    service = TestBed.inject(ExceptionService);
  });

  describe('handleError', () => {
    it('should log the error to the console', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      service.handleError(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleHttpError', () => {
    it('should handle a non-unauthorized HTTP error', (done) => {
      const httpError = new HttpErrorResponse({
        url: 'http://other-url.com',
        status: 500,
        error: { message: 'Internal Server Error' },
      });
      of(null)
        .pipe(
          switchMap(() => throwError(() => httpError)),
          service.handleHttpError()
        )
        .subscribe({
          next: () => {},
          error: (err) => {
            expect(err).toEqual(new Error('Server error 500: Internal Server Error'));
            done();
          },
        });
    });

    it('should handle an unauthorized HTTP error by showing a snack bar and reloading the page', (done) => {
      const httpError = new HttpErrorResponse({
        url: 'http://fake-api-url/some/path',
        status: HttpStatusCode.Unauthorized,
        error: { message: 'Session expired' },
      });

      of(null)
        .pipe(
          switchMap(() => throwError(() => httpError)),
          service.handleHttpError()
        )
        .subscribe({
          next: () => {},
          error: () => {
            expect(snackBarSpy.open).toHaveBeenCalledWith(
              'Your session has expired. Please login again.',
              'Ok',
              { duration: 0, politeness: 'assertive' }
            );
            expect(fakeDocument.location.reload).toHaveBeenCalled();
            done();
          },
        });
    });
  });
});
