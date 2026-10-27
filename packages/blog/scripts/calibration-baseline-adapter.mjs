import {extractRequestMetadata} from './packages/analytics/.test-dist/metadata.js';
import {classifyTraffic,classifyDevice} from './packages/analytics/.test-dist/classify.js';
import {classifyReaderKind} from './packages/analytics/.test-dist/readerkind.js';
export const baselineCommit="24c7c5010f6f41d8c8c81ac5a6b9e2cad65614fc";
export function baselinePrediction(request){const m=extractRequestMetadata(request);const c=classifyTraffic(m.userAgent);const r=classifyReaderKind({trafficClass:c.trafficClass,agentName:c.agentName,observationSource:'edge',asn:m.asn,secFetchMode:m.secFetchMode,secFetchDest:m.secFetchDest,secFetchSite:m.secFetchSite,secFetchUser:m.secFetchUser,acceptsHtml:m.acceptsHtml,hasAcceptLanguage:m.hasAcceptLanguage,signature:{status:'absent'},userAgent:m.userAgent});return{kind:r.kind,reason:r.reason,legacyDeviceType:classifyDevice(m.userAgent)};}
