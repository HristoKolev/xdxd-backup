export function isDetailedLoggingEnabled() {
  return process.env.CI_DEBUG === '1';
}

export function runsInCI() {
  return process.env.CI === 'true';
}

export function shouldBuildAndInstallOnEveryTest() {
  return process.env.BUILD_AND_INSTALL_ON_EVERY_TEST === 'true';
}
