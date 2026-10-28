import { verificationEvidence } from '../../.test-dist/signature-evidence.js';

// Supplied stored facts, not independently signed requests or operator labels.
const covered = { authority: true, targetUri: false, method: false, path: false, query: false, userAgent: true, contentDigest: false };
const coverage = { version: '2026-10-28.1', headerForm: 'dictionary', replayPolicy: 'expiry-only', ageSeconds: 0, validitySeconds: 300, otherComponentCount: 0, covered,
  selection: { policy: 'first-valid-in-input-order', matchedCandidates: 2, taggedCandidates: 2, attemptedCandidates: 1, unassessedCandidates: 1 } };
function request() { const r = new Request('https://publication.example/privacy'); Object.defineProperty(r,'cf',{value:{botManagement:{verifiedBot:true,signedAgent:false}}});return r; }
const valid = verificationEvidence(request(), {status:'verified',agent:'https://crawler.exa.ai',evidence:coverage},false,['ExaSearchBot']);
const legacy = { ...valid,version:'2026-10-27.3',verifierProfile:'2026-10-26.1',coverage:{...coverage,version:'2026-10-27.1'},vendor:{profile:'2026-10-27.1',method:'documented-signing-origin',documentedDeclarationCount:1,unmappedDeclarationCount:0,status:'matching-origin',userAgentCovered:true}};
delete legacy.coverage.selection; delete legacy.directoryPublication;
export const summaryCases = [
  {name:'current-valid',e:valid,status:'verified',local:'verified',coverage:'known',native:'available',vendor:'matching-origin'},
  {name:'legacy-valid',e:legacy,status:'verified',local:'verified',coverage:'known',native:'available',vendor:'matching-origin'},
  {name:'outcome-conflict',e:{...valid,localOutcome:'invalid'},status:'verified',local:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'top-level-conflict',e:valid,status:'unverified',local:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'injected-with-copied-proof',e:{...valid,source:'test-injected'},status:'verified',local:'test-injected',native:'available',vendor:'unrecognized'},
  {name:'coverage-number-instead-of-boolean',e:{...valid,coverage:{...coverage,covered:{...covered,userAgent:1}}},status:'verified',local:'verified',coverage:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'future-coverage',e:{...valid,coverage:{...coverage,version:'future'}},status:'verified',local:'verified',coverage:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'partial-coverage',e:{...valid,coverage:{...coverage,covered:{authority:true,userAgent:true}}},status:'verified',local:'verified',coverage:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'native-number-instead-of-boolean',e:{...valid,native:{verifiedBot:1,signedAgent:0}},status:'verified',local:'verified',coverage:'known',native:'unrecognized',vendor:'matching-origin'},
  {name:'partial-native',e:{...valid,native:{verifiedBot:true}},status:'verified',local:'verified',coverage:'known',native:'unrecognized',vendor:'matching-origin'},
  {name:'future-envelope',e:{...valid,version:'future'},status:'verified',local:'unrecognized',native:'unrecognized',vendor:'unrecognized'},
  {name:'outcome-only-history',e:null,status:'verified',local:'outcome-only',native:'not-recorded',vendor:'not-recorded'},
  {name:'unsigned-with-native-true',e:verificationEvidence(request(),{status:'absent'},false,['ExaSearchBot']),status:null,local:'absent',native:'available',vendor:'not-verified'},
  {name:'invalid-with-native-true',e:verificationEvidence(request(),{status:'unverified',reason:'signature-invalid'},false,['ExaSearchBot']),status:'unverified',local:'unverified',native:'available',vendor:'not-verified'},
  {name:'bad-selection',e:{...valid,coverage:{...coverage,selection:{...coverage.selection,attemptedCandidates:3}}},status:'verified',local:'verified',coverage:'known',native:'available',vendor:'matching-origin'},
  {name:'future-vendor',e:{...valid,vendor:{...valid.vendor,profile:'future'}},status:'verified',local:'verified',coverage:'known',native:'available',vendor:'unrecognized'},
  {name:'vendor-count-conflict',e:{...valid,vendor:{...valid.vendor,matchingDeclarationCount:0}},status:'verified',local:'verified',coverage:'known',native:'available',vendor:'unrecognized'},
  {name:'vendor-numeric-coverage',e:{...valid,vendor:{...valid.vendor,userAgentCovered:1}},status:'verified',local:'verified',coverage:'known',native:'available',vendor:'unrecognized'},
  {name:'old-optional-outcome-conflict',e:{...legacy,localOutcome:'invalid'},status:'verified',local:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'string-validity',e:{...valid,coverage:{...coverage,validitySeconds:'300'}},status:'verified',local:'verified',coverage:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'fractional-age',e:{...valid,coverage:{...coverage,ageSeconds:0.25}},status:'verified',local:'verified',coverage:'unrecognized',native:'available',vendor:'unrecognized'},
  {name:'empty-native-object',e:{...valid,native:{}},status:'verified',local:'verified',coverage:'known',native:'unrecognized',vendor:'matching-origin'},
  {name:'conflicting-origins-verified',e:verificationEvidence(request(),{status:'verified',agent:'https://crawler.exa.ai',evidence:coverage},false,['ExaSearchBot','Google-Agent']),status:'verified',local:'verified',coverage:'known',native:'available',vendor:'conflicting-origins'},
  {name:'conflicting-origins-unsigned',e:verificationEvidence(request(),{status:'absent'},false,['ExaSearchBot','Google-Agent']),status:null,local:'absent',native:'available',vendor:'conflicting-origins'},
  {name:'conflicting-origins-injected',e:verificationEvidence(request(),{status:'verified',agent:'https://crawler.exa.ai',evidence:coverage},true,['ExaSearchBot','Google-Agent']),status:'verified',local:'test-injected',native:'available',vendor:'test-injected'},
  {name:'known-native-negative',e:{...valid,native:{verifiedBot:false,signedAgent:false}},status:'verified',local:'verified',coverage:'known',native:'available',nativeVerified:false,vendor:'matching-origin'},
  {name:'known-native-unavailable',e:{...valid,native:{verifiedBot:null,signedAgent:null}},status:'verified',local:'verified',coverage:'known',native:'unavailable',vendor:'matching-origin'},
  {name:'absent-with-copied-coverage',e:{...valid,localStatus:'absent',localOutcome:'absent'},status:null,local:'unrecognized',native:'available',vendor:'unrecognized'},
];
