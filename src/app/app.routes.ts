import { Routes } from '@angular/router';

import { ShellComponent } from './containers/shell/shell.component';
import { mapStateGuard } from '@core/guards/map-state.guard';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [mapStateGuard],
  },
];
