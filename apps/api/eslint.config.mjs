import base from '@bool/eslint-config/base';

export default [
  ...base,
  { ignores: ['sst.config.ts', '.sst/**'] },
];
