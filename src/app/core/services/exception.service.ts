import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { OperatorFunction, catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExceptionService implements ErrorHandler {
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
        catchError((httpErrorResponse: HttpErrorResponse) => {
          const errorMessage =
            httpErrorResponse.error instanceof ErrorEvent
              ? `A client-side or network error occurred: ${httpErrorResponse.error.message}`
              : `Server returned code: ${httpErrorResponse.status}, error message is: ${httpErrorResponse.message}`;
          const error = new Error(errorMessage);
          this.handleError(error);
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}
