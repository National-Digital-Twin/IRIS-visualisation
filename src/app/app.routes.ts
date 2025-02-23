import { Routes } from '@angular/router';
import { mapStateGuard } from '@core/guards/map-state.guard';
import { ShellComponent } from './containers/shell/shell.component';

export const routes: Routes = [
    {
        path: '',
        component: ShellComponent,
        canActivate: [mapStateGuard],
    },
];
