// This pinned runtime's wasm export omits its types condition; its API is the root API.
declare module 'onnxruntime-web/wasm' { export * from 'onnxruntime-common'; }
