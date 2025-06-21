import path from 'path';

import { afterEach, beforeEach } from 'vitest';
import { $ } from 'zx';

export function useMockHomeDir(newDirectoryPostfix?: string) {
  let originalHome: string | undefined;
  let originalUserProfile: string | undefined;
  let originalZxHome: string | undefined;
  let originalZxUserProfile: string | undefined;

  beforeEach(() => {
    let resolvedNewDirectory: string;

    if (newDirectoryPostfix) {
      resolvedNewDirectory = path.resolve(process.cwd(), newDirectoryPostfix);
    } else {
      resolvedNewDirectory = process.cwd()!;
    }

    originalHome = process.env.HOME;
    originalUserProfile = process.env.USERPROFILE;
    originalZxHome = $.env.HOME;
    originalZxUserProfile = $.env.USERPROFILE;

    process.env.HOME = resolvedNewDirectory;
    process.env.USERPROFILE = resolvedNewDirectory;
    $.env.HOME = resolvedNewDirectory;
    $.env.USERPROFILE = resolvedNewDirectory;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalUserProfile;
    $.env.HOME = originalZxHome;
    $.env.USERPROFILE = originalZxUserProfile;
  });
}
