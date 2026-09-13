import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: 'http://10.1.21.26:8100/swagger/v1/swagger.json', // developer replaces with their spec URL or file path
    output: {
      target: './src/app/core/api',
      client: 'angular',
      mode: 'tags-split',
      override: {
        angular: {
          retrievalClient: 'both',
          runtimeValidation: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write', // keep generated output formatted consistently
    },
  },
});
