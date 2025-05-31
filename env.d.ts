declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Whether to build and install the project on every test run
       * @default "false"
       */
      BUILD_AND_INSTALL_ON_EVERY_TEST?: 'true';

      /**
       * Whether the process is being executed in CI
       */
      CI?: 'true';

      /**
       * If set to `1` CI debug in enabled.
       */
      CI_DEBUG?: '1';
    }
  }
}

export {};
