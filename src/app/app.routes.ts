import { Routes } from '@angular/router';
import { OtherDashboardComponent } from '@containers/other-dashboard/other-dashboard';
import { PlotlyDashboardComponent } from '@containers/plotly-dashboard/plotly-dashboard';
import { mapStateGuard } from '@core/guards/map-state.guard';
import { ShellComponent } from './containers/shell/shell.component';

export const routes: Routes = [
    {
        path: '',
        component: ShellComponent,
        canActivate: [mapStateGuard],
    },
    {
        path: 'dashboards/plotly',
        component: PlotlyDashboardComponent,
    },
    {
        path: 'dashboards/other',
        component: OtherDashboardComponent,
    },
];

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
