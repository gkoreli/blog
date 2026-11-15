// Client-side entry point — registers @nisli/core interactive components
import { createDefaultClientLogger, initClientErrorReporting } from '@gkoreli/client-observability/client';
import { initSubscribeForm } from './subscribe.js';
import { clientBuildId } from './build-identity.js';
import { localizeTimeElements } from './local-time.js';
import './components/theme-toggle.js';
import './components/burger-menu.js';
import './search-launcher.js';
import { initReading } from './reading.js';
import { initSectionNavigation } from './section-navigation.js';

const logger = createDefaultClientLogger({ buildId: clientBuildId() });

initClientErrorReporting(logger);
localizeTimeElements();
initReading();
initSectionNavigation();
initSubscribeForm({ logger });
