import { Injectable, ErrorHandler, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpStatusCode,
} from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DOCUMENT } from '@angular/common';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import {
  EMPTY,
  OperatorFunction,
  catchError,
  throwError,
  switchMap,
  tap,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExceptionService implements ErrorHandler {
  private readonly snackBar = inject(MatSnackBar);
  private readonly location = inject(DOCUMENT).location;
  private readonly telicentBaseURL = inject(RUNTIME_CONFIGURATION).apiURL;

  /**
   * Handle Error.
   *
   * Handle errors that occur within the application.
   * Log the error to the console.
   */
  handleError(error: Error): void {
    console.error(error);
  }

  /**
   * Handle Http Error.
   *
   * Handles errors that occure within HTTP requests streams.
   */
  handleHttpError<T>(): OperatorFunction<HttpEvent<T>, HttpEvent<T>> {
    return request$ =>
      request$.pipe(
        catchError((httpError: HttpErrorResponse) => {
          const { url, status, error } = httpError;

          /**
           * If the error is from the Telicent API, and the error is an
           * 401 or 403, then reload the page causing the user to be
           * presented with the login screen. This ocures when a requests
           * cookies have expired or the user has invalid credentials.
           */
          if (url?.includes(this.telicentBaseURL)) {
            const unauthorized =
              status === HttpStatusCode.Unauthorized ||
              status === HttpStatusCode.Forbidden;
            if (unauthorized) {
              /* create a new error object and handle it */
              const message = `Unauthorized telicent API request. ${error.message}`;
              const newError = new Error(message);
              this.handleError(newError);

              /* open snackbar and reload the browsers page once dismissed */
              return this.snackBar
                .open('Your session has expired. Please login again.', 'Ok', {
                  duration: 0,
                  politeness: 'assertive',
                })
                .afterDismissed()
                .pipe(
                  tap(() => this.location.reload()),
                  switchMap(() => throwError(() => EMPTY))
                );
            }
          }

          /* create a new error object and handle it for all other http erors */
          const message =
            error instanceof ErrorEvent
              ? `A client-side or network error occurred: ${error.message}`
              : `Server returned code: ${status}, error message is: ${error.message}`;
          const newError = new Error(message);
          this.handleError(newError);

          /* thorw the error to the next error handler */
          return throwError(() => newError);
        })
      );
  }
}
