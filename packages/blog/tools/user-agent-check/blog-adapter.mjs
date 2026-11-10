import { analyzeTraffic } from '../../../analytics/src/classify.ts';

export default function assess(userAgent) {
  const result = analyzeTraffic(userAgent);
  return {
    namedClients: result.declarations.candidates,
    automationClaim: result.trafficClass !== 'browser',
  };
}
