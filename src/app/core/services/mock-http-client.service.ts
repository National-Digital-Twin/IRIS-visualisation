import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WRITE_BACK_ENDPOINT } from '@core/tokens/write-back-endpoint.token';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MockHttpClient extends HttpClient {
  private readonly writebackendpoint = inject(WRITE_BACK_ENDPOINT);

  override post<T>(
    url: string,
    body: unknown,
    ops?: { withCredentials?: boolean }
  ) {
    if (url === `${this.writebackendpoint}/flag-to-investigate`) {
      const randomUUID = Math.random().toString(36).substring(2, 15);
      const response = `https://nationaldigitaltwin.gov.uk/data#${randomUUID}`;
      console.debug('MockHttpClient: flag-to-investigate', response);
      return of<T>(response as unknown as T);
    }

    if (url === `${this.writebackendpoint}/invalidate-flag`) {
      const randomUUID = Math.random().toString(36).substring(2, 15);
      const response = `https://nationaldigitaltwin.gov.uk/data#${randomUUID}`;
      console.debug('MockHttpClient: invalidate-flag', response);
      return of<T>(response as unknown as T);
    }

    return super.post<T>(url, body, ops);
  }
}
