exports.Kind = { Value: 42, Object: 999, Array: 996 };
exports.Tag = { Object: 999, Array: 996 };
const make = (options) => ({ tag: 999, ...options });
const normalize = (params) => {
  params.types = params.types?.map((type, index) => make({ type, length: params.values[index].length }));
  return params;
};
exports.normalize = (params) => normalize(params);
exports.make = make;
