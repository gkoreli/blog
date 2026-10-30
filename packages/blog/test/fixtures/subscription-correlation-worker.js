import {handleConfirmationRequest} from '../../../newsletter/src/confirmation-request.ts';
import {handleClientError} from '../../../client-observability/src/server.ts';

// Local fixture only: deliberately absent credentials stop the real signup handler
// before verification/admission/mail. Capture only its closed structured log fields.
const stages=[];
export default {async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/subscribe'){
    const previous=console.log;
    console.log=(label,event)=>{if(label==='[newsletter:confirmation]')stages.push({attemptId:event.attemptId,stage:event.stage});};
    try{return await handleConfirmationRequest(request,{DB:env.DB},'subscribe');}
    finally{console.log=previous;}
  }
  if(path==='/api/client-error')return handleClientError(request,env);
  if(path==='/stages')return Response.json(stages);
  if(path==='/reset'){stages.length=0;await env.DB.prepare('DELETE FROM client_errors').run();return new Response(null,{status:204});}
  return new Response(null,{status:404});
}};
