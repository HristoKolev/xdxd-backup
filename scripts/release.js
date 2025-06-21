#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { program } from 'commander';
import { $, chalk } from 'zx';

import { configureLogging } from './helpers/logging.js';
import { configureZx } from './helpers/zx.js';

/**
 * Release Script
 *
 * This script automates the release process for the xdxd-backup package.
 * It handles version bumping, git operations, and GitHub release creation.
 *
 * Features:
 * - Bumps npm package version (patch, minor, or major)
 * - Commits and pushes the version change to git
 * - Creates a corresponding GitHub release
 *
 * Usage:
 *   npm run release        # Creates a patch release
 *   npm run release minor  # Creates a minor release
 *   npm run release major  # Creates a major release
 *
 * Requirements:
 * - GitHub CLI (gh) must be installed and authenticated
 * - Git repository must be clean and up to date
 * - Must have push access to the repository
 *
 * Error Handling:
 * - Validates version type arguments
 * - Checks for git repository status
 * - Verifies working directory is clean
 * - Ensures GitHub CLI is available
 * - Handles all command execution failures with detailed error messages
 */

const __filename = fileURLToPath(import.meta.url);

configureZx();

const logger = configureLogging(path.basename(__filename));

program
  .description('Release script for creating npm versions and GitHub releases')
  .argument(
    '[version-type]',
    'Version type to bump (patch, minor, major)',
    'patch'
  )
  .action(async (versionType) => {
    try {
      // Validate version type
      const validVersionTypes = ['patch', 'minor', 'major'];
      if (!validVersionTypes.includes(versionType)) {
        throw new Error(
          `Invalid version type: ${versionType}. Must be one of: ${validVersionTypes.join(', ')}`
        );
      }

      logger.info(chalk.green(`Creating ${versionType} version...`));

      // Check if we're in a git repository
      try {
        await $`git status`;
      } catch (error) {
        logger.error('Git status check failed:', error);
        throw new Error('Not in a git repository or git is not available');
      }

      // Check if working directory is clean
      const gitStatus = await $`git status --porcelain`;
      if (gitStatus.stdout.trim()) {
        logger.error('Working directory has uncommitted changes');
        throw new Error(
          'Working directory is not clean. Please commit or stash your changes first.'
        );
      }

      // Check if GitHub CLI is available
      try {
        await $`gh --version`;
      } catch (error) {
        logger.error('GitHub CLI check failed:', error);
        throw new Error(
          'GitHub CLI (gh) is not installed or not available in PATH'
        );
      }

      // Step 1: Bump the version in package.json and create a git tag
      // This automatically commits the version change and creates a git tag
      logger.info(chalk.blue('Bumping version...'));
      await $`npm version ${versionType}`;

      logger.info(chalk.green('Pushing to git...'));

      // Step 2: Push the commit and tag to the remote repository
      await $`git push`;

      logger.info(chalk.green('Getting package version...'));

      // Step 3: Extract the new version number from package.json
      // We need this to create the GitHub release with the correct tag
      const npmVersionOutput = await $`npm pkg get version`;
      const npmVersion = npmVersionOutput.stdout.trim().replaceAll(/"/g, '');

      if (!npmVersion) {
        logger.error('Failed to extract version from package.json');
        throw new Error('Failed to get version from package.json');
      }

      logger.info(
        chalk.green(`Creating GitHub release for version ${npmVersion}...`)
      );

      // Step 4: Configure GitHub CLI to run without interactive prompts
      process.env.GH_PROMPT_DISABLED = 'true';

      // Step 5: Create the GitHub release using the git tag created by npm version
      // The release will be marked as the latest release
      await $`gh release create ${npmVersion} --title=${npmVersion} --latest`;

      logger.info(chalk.green(`Release ${npmVersion} created successfully!`));
    } catch (error) {
      logger.fatal(chalk.red(`Script "${__filename}" failed.`), error);
      process.exit(1);
    }
  });

program.parse();
