// Client-side entry point — registers @nisli/core interactive components
import { createDefaultClientLogger, initClientErrorReporting } from '@gkoreli/client-observability/client';
import { initSubscribeForm } from './subscribe.js';
import './components/theme-toggle.js';
import './components/burger-menu.js';

const logger = createDefaultClientLogger();

initClientErrorReporting(logger);
initSubscribeForm({ logger });
