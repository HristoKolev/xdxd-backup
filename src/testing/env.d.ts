declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Whether to build and install the project on every test run
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

      /**
       * If set to `true` means that the debugger is attached.
       */
      IS_DEBUGGER_ATTACHED?: 'true';

      /**
       * If set to `true` means that the non existing executables tests should be run.
       */
      RUN_NON_EXISTING_EXECUTABLES_TESTS?: 'true';
    }
  }
}

export {};
