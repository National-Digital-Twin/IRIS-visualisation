import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
} from '@angular/common/http';
import { ExceptionService } from '@core/services/exception.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HandleHttpErrorInterceptor implements HttpInterceptor {
  private readonly exceptionService = inject(ExceptionService);

  /**
   * Intercept Http Request.
   *
   * Intercept HTTP requests and handle errors that occur within HTTP request streams.
   */
  intercept<T>(
    request: HttpRequest<T>,
    next: HttpHandler
  ): Observable<HttpEvent<T>> {
    return next
      .handle(request)
      .pipe(this.exceptionService.handleHttpError<T>());
  }
}
