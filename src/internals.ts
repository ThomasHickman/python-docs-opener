import { getVSCodeDownloadUrl } from "@vscode/test-electron/out/util";
import child_process = require("child_process");
import readline = require("readline");
import * as vscode from "vscode";


const PYTHON_VENV = "/home/thomas/Documents/python-help-fetcher/venv/bin/python3"
const PYTHON_SCRIPT = "/home/thomas/Documents/python-help-fetcher/src/get_function_at_position.py"

export class HelpFetcher {
    private fetcherProcess: child_process.ChildProcessWithoutNullStreams;
    private readlineInterface: readline.Interface;
    constructor() {
        this.fetcherProcess = child_process.spawn(PYTHON_VENV, [PYTHON_SCRIPT]);
        this.readlineInterface = readline.createInterface({input: this.fetcherProcess.stdout, output: this.fetcherProcess.stdin});
        
        const fetcherProcessStderrInterface = readline.createInterface({input: this.fetcherProcess.stderr});
        fetcherProcessStderrInterface.on("line", line => {
            vscode.window.showErrorMessage(`Stderr outputted ${line}`);
        })
    }

    public destroy() {
        this.readlineInterface.close()
        this.fetcherProcess.kill();
    }

    public async getFunctionAtPosition(file: string, line: number, column: number) {
        return new Promise<string>((resolve, reject) => {
            const inputObject = {
                "file": file,
                "line": line,
                "column": column
            }

            this.readlineInterface.question(JSON.stringify(inputObject) + "\n", (answer: string) => {
                resolve(JSON.parse(answer));
            })
        })
    }
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

            if (python_constants.has(symbol_parts[1])) {
                return `https://docs.python.org/3/library/constants.html#${symbol_parts[1]}`
            }
            else if (symbol_parts[1].endsWith("Exception")
                || symbol_parts[1].endsWith("Error")
                || symbol_parts[1].endsWith("Exit")
                || symbol_parts[1].endsWith("Interrupt")) {
                return `https://docs.python.org/3/library/exceptions.html#${symbol_parts[1]}`
            }
            else {
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
