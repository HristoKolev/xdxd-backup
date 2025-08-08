# JS / TS files

This section applies to JavaScript and TypeScript files.

# General guidelines

- Check each usage of `str.replace()` and replace it with `str.replaceAll()` if possible.
- When using `str.replaceAll()`, try not to use regex if possible.
- When modifing a file, run any test that is related to the file to ensure that the changes do not break anything.

## Command line interface (CLI)

- Use the `commander` package for command line arguments parsing and any command line interactions.
- Use `new Command()` to create the default command
- Use `command.parse(process.argv)` to parse the command line arguments.

## Logging

- Use `log4js` for logging instead of `console`.
- Look for the closest function `configureLogging` in the codebase to see how to configure `log4js`.
- When trying to log an error log the entire error object, not just the error message. Every time you see `error.message` being logged, replace it with `error` to log the entire error object.
- When logging fatal errors use `logger.fatal` instead of `logger.error`. A fatal error is an error that cannot be recovered from and the script should exit immediately.

## Running commands from the code

- Use `zx` for shell commands execution.
- Look for the closest function `configureZx` in the codebase to see how to configure `zx`.

## Node.js

- When importing nodejs built-in modules, use the `node:` prefix.
- When using IO operations always use async functions.
- When importing `fs` use `import fs from 'node:fs/promises'` to use the promise-based API.
- When needing to use functions from `fs` that are not available in the promise-based API, use `import fsSync from 'node:fs'`.
- Always import global object `process` explicitly. Do not use `process` without importing it first.
- Always import global object `console` explicitly. Do not use `console` without importing it first.
- Do not use the `rimraf` package for anything. Use `fs.rm()` instead.

## JS script files

This section applies to JavaScript files in the `scripts` folder.

- Look at the other scripts in the `scripts` folder to see how they are structured.
- Whenever possible use helper functions from the `scripts/helpers` folder.
- Each script should be self-contained and not depend on other scripts.
- Each script should be present in the `package.json`.

### JS script documentation

- Each script should be documented with comments explaining the purpose of the script.
- The script headers should **ONLY** include short description, usage section and requirements section (if necessary).
- The script documentation (file header) should be after the `import` statements, not before.

## Commands

This section applies to commands in the `src/commands` folder.

- Look at the other commands in the `src/commands` folder to see how they are structured.
- Each command should be self-contained and not depend on other commands.
- Look at the `src/shared` folder for shared code that can be used in commands.
- Each command should be registered in the `src/cli.ts` file.

### Command tests

- Each command should have a test file next to it.
- Look at the tests for other commands to see how they are structured.
- Look at the `src/testing` folder for shared code that can be used in command tests.

## Cross-platform considerations

This project (including the tests) is cross-platform and should work on Windows, macOS, and Linux.

- Use `path.join()` or `path.resolve()` to construct file paths in a cross-platform way.
- When writing text files, always use the appropriate line endings for the OS. Use `os.EOL` in Node.Js context.
- When reading text files, read them in such a way so that it works with all line endings even on a platform that is different from the current one.
- Use `zx` for shell commands execution and try to use cli commands that are available on all platforms. If that is not possible run conditional checks for the operating system and adjust the commands accordingly.
- `\n` or `\r\n` must not be hardcoded in string literals. Always import os from `node:os` and use `os.EOL` for multi-line strings.
- Build multi-line content as arrays and join with `os.EOL` (e.g., `['a','b'].join(os.EOL)`).
- When asserting against output or file content, normalize line endings first:
- Prefer `replaceAll('\r\n', '\n')` or compare arrays via `split(/\r?\n/)`.
- Don’t use regex with `replaceAll` unless necessary; use plain `replaceAll` where possible.
- When splitting lines, always use `text.split(/\r?\n/)`. Don’t split on `\n`.
- When trimming trailing newlines in assertions, use `trimEnd()` instead of slicing literals.

# NPM scripts

All of the below NPM scripts should be run when trying to check if a change works:

- Use `npm run format` to format the code when necessary.
- Use `npm run lint` and `npm run lint:package` to lint the code when necessary.
- Use `npm run test` to run the tests when necessary.
- Use `npm run build` to build the project when necessary.

# Script files (`.sh` or `.ps1`)

When working on script files `.ps1` or `.sh` files:

- Handle errors correctly. Error handling should be as strict as possible.

## Powershell scripts

When working on Powershell (`.ps1`) files:

- Make sure they should work on both Powershell 6 (on Windows) and Powershell 7+ (Windows, Linux, MacOS).
- Use `param()` when reading command line parameters when possible.

## Shell scripts

When working on Shell script (`.sh`) files:

- Make sure they work cross-platform (on linux and macOS) and can be executed by the `sh` command and not only by `bash`.

# The "README.md" file

- The `README.md` should include usage instructions for each command.
- The `README.md` file should be updated when commands are added, removed or changed.
