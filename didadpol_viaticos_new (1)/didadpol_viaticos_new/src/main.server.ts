import 'zone.js/node';

import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, appConfig, context);

export default bootstrap;