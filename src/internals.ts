import child_process = require("child_process");

export function getFunctionAtPosition(file: string, line: number, column: number) {
    return new Promise<string>((resolve, reject) => {
        // TODO: make this not a fixed path
        child_process.execFile("/home/thomas/Documents/python-help-fetcher/venv/bin/python3", [
            "/home/thomas/Documents/python-help-fetcher/src/get_function_at_position.py", file, line.toString(), column.toString()
        ], (error, stdout, stderr) => {
            if (error !== null) {
                reject(Error(`get_function_at_position failed.\nstderr:\n${stderr}`))
            }
            else {
                resolve(stdout.trimEnd())
            }
        })
    })
}

export function getDocWebPageFromSymbol(symbol_name: string) {
    /**
     * Gets the helptext webpage for the given symbol name.
     * 
     * @returns A string of the webpage if one can be found, otherwise `null`.
     */
    const symbol_parts = symbol_name.split(".");

    if (symbol_parts[0] === "builtins") {
        const non_builtins_symbol_name = symbol_parts.slice(1).join(".");
        // TODO: the constants/exceptions/functions handling is not complete and bit brittle. We could make this better.

        if (symbol_parts.length == 2) {
            // Handle built in functions and constants
            const python_constants = new Set(["False", "True", "None", "NotImplemented", "Ellipsis", "__debug__", "quit", "copyright", "credits", "license"]);

            if (python_constants.has(symbol_parts[1])){
                return `https://docs.python.org/3/library/constants.html#${symbol_parts[1]}`
            }
            else if(symbol_parts[1].endsWith("Exception") 
                    || symbol_parts[1].endsWith("Error")
                    || symbol_parts[1].endsWith("Exit")
                    || symbol_parts[1].endsWith("Interrupt")){
                return `https://docs.python.org/3/library/exceptions.html#${symbol_parts[1]}`
            }
            else{
                return `https://docs.python.org/3/library/functions.html#${symbol_parts[1]}`
            }

            throw Error("AssertionError: all paths here should return.")
        }

        // TODO: find a way to represent from here onwards: https://docs.python.org/3/library/stdtypes.html#contextmanager.__enter__
        const stdtypes = new Set(["int", "float", "complex", "list", "tuple", "range", "str", "bytes, bytearray", "memoryview", "set", "frozenset", "dict"]);

        if (stdtypes.has(symbol_parts[1])) {
            return `https://docs.python.org/3/library/stdtypes.html#${non_builtins_symbol_name}`
        }

        const module_name = symbol_parts[1];

        return `https://docs.python.org/3/library/${module_name}.html#${non_builtins_symbol_name}`

    }
    else {
        console.log(`Trying to query symbol ${symbol_name} that is not a built-in.`)

        return null;
    }
}
