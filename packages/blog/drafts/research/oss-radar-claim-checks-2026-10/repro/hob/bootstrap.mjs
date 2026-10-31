process.parentPort={postMessage:(m)=>process.send(m),on:(e,cb)=>process.on(e,(data)=>cb({data}))};
await import('./engine.mjs');
process.send({type:'research-ready'});
