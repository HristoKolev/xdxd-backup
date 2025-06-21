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

### Logging and error handling

- When trying to log an error log the entire error object, not just the error message. Use `log.error(error)` instead of `log.error(error.message)`.

# JS script files

When working on JavaScript (`.js`) files in the `scripts` folder:

- Look at the other scripts in the `scripts` folder to see how they are structured.
- Whenever possible use helper functions from the `scripts/helpers` folder.
- Each script should be self-contained and not depend on other scripts.
- Each script should be well documented with comments explaining the purpose of the script and its main functions.
- The script documentation (file header) should be after the `import` statements, not before.
- Each script should be present in the `package.json`.

# Project commands

All of the below commands should be run when trying to check if a change works:

- Use `npm run format` to format the code when necessary.
- Use `npm run lint` and `npm run lint:package` to lint the code when necessary.
- Use `npm run test` to run the tests when necessary.
- Use `npm run build` to build the project when necessary.
