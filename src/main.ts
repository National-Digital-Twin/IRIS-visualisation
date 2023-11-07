import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

fetch('config.json')
  .then(response => response.json())
  .then(config =>
    bootstrapApplication(AppComponent, {
      providers: [
        ...appConfig.providers,
        { provide: RUNTIME_CONFIGURATION, useValue: config },
      ],
    }).catch(err => console.error(err))
  );
