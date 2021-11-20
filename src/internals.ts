import child_process = require("child_process");
import { builtInModules } from "./data";
import readline = require("readline");
import * as vscode from "vscode";
import * as path from "path";


const PYTHON_SCRIPT = path.join(path.dirname(__dirname), "static", "get_function_at_position.py")

export class HelpFetcher {
    private fetcherProcess: child_process.ChildProcessWithoutNullStreams;
    private readlineInterface: readline.Interface;
    constructor(pythonExecutable: string) {
        this.fetcherProcess = child_process.spawn(pythonExecutable, [PYTHON_SCRIPT]);
        this.readlineInterface = readline.createInterface({input: this.fetcherProcess.stdout, output: this.fetcherProcess.stdin});
        
        // TODO: maybe report stderr here?
        // const fetcherProcessStderrInterface = readline.createInterface({input: this.fetcherProcess.stderr});
        // fetcherProcessStderrInterface.on("line", line => {
        //     logs.append("stderr: " + line);
        // });
    }

    public destroy() {
        this.readlineInterface.close()
        this.fetcherProcess.kill();
    }

    public async getFunctionAtPosition(file: string, line: number, column: number, pythonExecutable?: string) {
        return new Promise<string>((resolve, reject) => {
            let inputObject = {
                "file": file,
                "line": line,
                "column": column
            }

            if (pythonExecutable){
                inputObject["pythonExecutable"] = pythonExecutable
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
    const module_name = symbol_parts[0];
    const non_module_path = symbol_parts.slice(1).join(".");

    if (module_name === "builtins") {
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
            return `https://docs.python.org/3/library/stdtypes.html#${non_module_path}`
        }
    }
    else if (builtInModules.has(module_name)){
        return `https://docs.python.org/3/library/${module_name}.html#${symbol_name}`
    }

    return null;
}
