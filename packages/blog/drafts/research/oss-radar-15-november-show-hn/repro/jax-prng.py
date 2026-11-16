import sys,json,hashlib
import numpy as np
import jax,jax.numpy as jnp
sys.path.insert(0,sys.argv[1])
import deepseek_v3 as ds
rows=[]
batch=jnp.asarray(np.random.default_rng(0).integers(0,ds.TINY.vocab,(2,18),dtype=np.int32))
for flag in [False,True]:
 jax.config.update("jax_threefry_partitionable",flag)
 params=ds.init_params(ds.TINY,jax.random.key(0))
 biases=jnp.zeros((ds.TINY.n_layers-ds.TINY.n_dense,ds.TINY.n_routed))
 loss,m=ds.loss_fn(params,biases,batch,ds.TINY)
 rows.append({"partitionable":flag,"seed":0,"embeddingSha256":hashlib.sha256(np.asarray(params["embed"]).tobytes()).hexdigest(),"firstLoss":float(loss),"mainLoss":float(m["main"])})
assert rows[0]["embeddingSha256"]!=rows[1]["embeddingSha256"]
result={"jax":jax.__version__,"source":"6901be60941b98dc654ed542465290db9e8bafa6","config":"TINY","batch":"Fixed NumPy seed-0 batch in both conditions", "cases":rows,"scope":"CPU first-forward initialization control; no newer-JAX, GPU, corpus, training-trajectory or speed result."}
open(sys.argv[2],"x").write(json.dumps(result,indent=2)+"\n")
print(json.dumps(result))
