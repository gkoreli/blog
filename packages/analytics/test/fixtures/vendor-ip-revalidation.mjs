export const validationCases=[
 {name:'same-strong-tag',old:{ETag:'"v1"'},next:{ETag:'"v1"'},accepted:true},
 {name:'same-weak-tag',old:{ETag:'W/"v1"'},next:{ETag:'W/"v1"'},accepted:true},
 {name:'new-weak-old-strong',old:{ETag:'"v1"'},next:{ETag:'W/"v1"'},accepted:true},
 {name:'new-strong-old-weak',old:{ETag:'W/"v1"'},next:{ETag:'"v1"'},accepted:false},
 {name:'changed-strong-tag',old:{ETag:'"v1"'},next:{ETag:'"v2"'},accepted:false},
 {name:'changed-weak-tag',old:{ETag:'W/"v1"'},next:{ETag:'W/"v2"'},accepted:false},
 {name:'missing-304-validator',old:{ETag:'"v1"'},next:{},accepted:false},
 {name:'malformed-304-tag',old:{ETag:'"v1"'},next:{ETag:'"v1", "v2"'},accepted:false},
 {name:'unsolicited-304',old:{},next:{},accepted:false},
 {name:'unsolicited-tagged-304',old:{},next:{ETag:'"v1"'},accepted:false},
 {name:'matching-modification-date',old:{'Last-Modified':'Mon, 26 Oct 2026 00:00:00 GMT'},next:{'Last-Modified':'Mon, 26 Oct 2026 00:00:00 GMT'},accepted:true},
 {name:'changed-modification-date',old:{'Last-Modified':'Mon, 26 Oct 2026 00:00:00 GMT'},next:{'Last-Modified':'Tue, 27 Oct 2026 00:00:00 GMT'},accepted:false},
 {name:'strong-tag-mismatch-overrides-date-match',old:{ETag:'"v1"','Last-Modified':'Mon, 26 Oct 2026 00:00:00 GMT'},next:{ETag:'"v2"','Last-Modified':'Mon, 26 Oct 2026 00:00:00 GMT'},accepted:false},
];
export async function runValidationCases(verifyVendorIp,createVendorIpCache){
 const at=new Date('2026-10-28T04:00:00Z'),later=new Date(at.getTime()+31000);
 const request=()=>{const r=new Request('https://fixture.example/',{headers:{'CF-Connecting-IP':'66.249.66.1'}});Object.defineProperty(r,'cf',{value:{asn:64512}});return r;};
 const results=[];
 for(const c of validationCases){const cache=createVendorIpCache();let calls=0,conditionals;
  const fetcher=async(url,init)=>{calls++;if(calls===1)return Response.json({prefixes:[{ipv4Prefix:'66.249.66.0/24'}]},{headers:{'Cache-Control':'no-cache',...c.old}});conditionals={etag:init.headers.get('If-None-Match'),modified:init.headers.get('If-Modified-Since')};return new Response(null,{status:304,headers:c.next});};
  const first=await verifyVendorIp(request(),['Googlebot'],{cache,fetcher,now:at});const second=await verifyVendorIp(request(),['Googlebot'],{cache,fetcher,now:later});
  results.push({name:c.name,expectedAccepted:c.accepted,outcome:second.checks[0].outcome,reason:second.checks[0].reason,accepted:second.checks[0].outcome==='listed',sameDigest:second.checks[0].snapshot?.sha256===first.checks[0].snapshot?.sha256,cacheEntries:cache.feeds.size,calls,conditionals});
 }
 return results;
}

// One exact row; production callers validate and interpolate only its decimal ID.
export const REVALIDATION_READBACK_SQL = `SELECT collection_version AS collectionVersion,
 json_extract(vendor_ip_evidence, '$.profile') AS ipProfile,
 json_extract(vendor_ip_evidence, '$.source') AS source,
 json_extract(vendor_ip_evidence, '$.method') AS method,
 json_extract(vendor_ip_evidence, '$.declarationCount') AS declarations,
 json_extract(vendor_ip_evidence, '$.configuredDeclarationCount') AS configured,
 json_extract(vendor_ip_evidence, '$.unmappedDeclarationCount') AS unmapped,
 json_array_length(vendor_ip_evidence, '$.checks') AS checks,
 referrer_host AS referrerHost, is_owner AS isOwner, path
 FROM page_observations WHERE id = ?`;
