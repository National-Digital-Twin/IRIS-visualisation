import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SignalsService {
  detailsPanelOpen = signal<boolean>(false);
}
