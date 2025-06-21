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

# JS / TS files

When working on JavaScript (`.js`) or TypeScript (`.ts`) files:

- Use the `commander` package for command line arguments parsing and any command line interactions.
- Use `log4js` for logging instead of `console.log`. Look for the closest function `configureLogging` in the codebase to see how to configure it.
- Use `zx` for shell commands execution. Look for the closest function `configureZx` in the codebase to see how to configure it.
- Check each usage of `str.replace()` and replace it with `str.replaceAll()` if possible.
- Do not use `rimraf` for anything. use `fs.rm()` instead.
- When importing nodejs built-in modules, use the `node:` prefix, e.g. `import fs from 'node:fs'`.
- When using io operations always use async version of the function, e.g. `fs.readFileSync()` instead of `fs.readFile()`.
- When importing `fs` use `import fs from 'node:fs/promises'` to use the promise-based API.
- When needing to use functions from `fs` that are not available in the promise-based API, use `import fsSync from 'node:fs'`.
- Always import global objects like `process` and `console` using the `node:` prefix, e.g. `import process from 'node:process'`.

### Logging and error handling

- When trying to log an error log the entire error object, not just the error message. Use `logger.error(error)` instead of `logger.error(error.message)`. You should still log descriptive messages before logging the error object, e.g. `logger.error('An error occurred:', error)`.
- When logging fatal errors use `logger.fatal` instead of `logger.error`. A fatal error is an error that cannot be recovered from and the script should exit immediately.

# JS script files

When working on JavaScript (`.js`) files in the `scripts` folder:

- Look at the other scripts in the `scripts` folder to see how they are structured.
- Whenever possible use helper functions from the `scripts/helpers` folder.
- Each script should be self-contained and not depend on other scripts.
- Each script should be documented with comments explaining the purpose of the script and its main functions. Script headers should only include short description and usage instructions.
- The script documentation (file header) should be after the `import` statements, not before.
- Each script should be present in the `package.json`.

# Project commands

All of the below commands should be run when trying to check if a change works:

- Use `npm run format` to format the code when necessary.
- Use `npm run lint` and `npm run lint:package` to lint the code when necessary.
- Use `npm run test` to run the tests when necessary.
- Use `npm run build` to build the project when necessary.
