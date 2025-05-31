declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Whether to build and install the project on every test run
       * @default "false"
       */
      BUILD_AND_INSTALL_ON_EVERY_TEST?: string;
    }
  }
}

export {};
