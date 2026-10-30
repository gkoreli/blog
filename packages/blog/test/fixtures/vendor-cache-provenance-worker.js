import { verifyVendorIp, createVendorIpCache } from '../../../analytics/src/vendor-ip.ts';
import { cachePolicyCases } from '../../../analytics/test/fixtures/vendor-cache-provenance.mjs';

export default { async fetch() { return Response.json(await cachePolicyCases(verifyVendorIp, createVendorIpCache)); } };
