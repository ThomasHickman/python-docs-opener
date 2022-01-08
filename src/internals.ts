import child_process = require("child_process");
import { builtInModules } from "./data";
import readline = require("readline");
import * as path from "path";
import * as vscode from "vscode";


const PYTHON_SCRIPT = path.join(path.dirname(__dirname), "static", "get_function_at_position.py")

export class HelpFetcher {
    private fetcherProcess: child_process.ChildProcessWithoutNullStreams;
    private readlineInterface: readline.Interface;

    private inErrorReporting = false;
    private errorReportingBuffer = "";

    constructor(pythonExecutable: string) {
        this.fetcherProcess = child_process.spawn(pythonExecutable, [PYTHON_SCRIPT]);
        this.readlineInterface = readline.createInterface({input: this.fetcherProcess.stdout, output: this.fetcherProcess.stdin});
        
        const fetcherProcessStderrInterface = readline.createInterface({input: this.fetcherProcess.stderr});
        fetcherProcessStderrInterface.on("line", line => {
            this.errorReportingBuffer += line + "\n";
            if (!this.inErrorReporting){
                this.inErrorReporting = true;
                setTimeout(() => {
                    vscode.window.showWarningMessage(this.errorReportingBuffer);
                    this.inErrorReporting = false;
                }, 100)
            }
        });
    }

    public destroy() {
        this.readlineInterface.close()
        this.fetcherProcess.kill();
    }

    public async getFunctionAtPosition(file: string, line: number, column: number, pythonExecutable?: string, fileText?: string) {
        return new Promise<string | null>((resolve, reject) => {
            let inputObject = {
                "file": file,
                "line": line,
                "column": column
            }

            if (pythonExecutable){
                inputObject["pythonExecutable"] = pythonExecutable
            }

            if(fileText){
                inputObject["fileText"] = fileText;
            }

            this.readlineInterface.question(JSON.stringify(inputObject) + "\n", (answer: string) => {
                resolve(JSON.parse(answer));
            })
        })
    }
}

export function getWebPageFromSymbolUsingSettings(symbol_name: string, setting_object: object): string | null{
    const symbol_parts = symbol_name.split(".");
    const module_name = symbol_parts[0];

    if ((new Set(Object.keys(setting_object))).has(module_name)){
        const webpageTemplate: string = setting_object[module_name];

        return webpageTemplate.replace("${symbol_name}", symbol_name)
                              .replace("${module_name}", module_name);
    }
    else{
        return null;
    }
}

// TODO: I have found that this can get fed a `null` - we should check how this can happen
// TODO: xml.parsers.expat maps to pyexpat :'(
// urllib.response.addinfourl is at https://docs.python.org/3/library/urllib.request.html#urllib.response.addinfourl
// TODO: hard coding this is a bit hacky - we might be able to do this automatically by scraping the list of module pages
const SPECIAL_CASE_PAGES = new Map([
    ["xml.parsers.expat", "pyexpat"],
    ["urllib.response", "urllib.request"]
]);

const SUBMODULES_WITH_SEPARATE_PAGES = [
    "collections.abc",
    "os.path",
    "logging.config",
    "logging.handlers",
    "curses.ascii",
    "curses.panel",
    "multiprocessing.shared_memory",
    "concurrent.futures",
    "html.parser",
    "html.entities",
    "xml.etree.elementtree",
    "xml.dom",
    "xml.dom.minidom",
    "xml.dom.pulldom",
    "xml.sax",
    "xml.sax.handler",
    "xml.sax.utils",
    "xml.sax.reader",
    "urllib.request",
    "urllib.parse",
    "urllib.error",
    "urllib.robotparser",
    "http.client",
    "http.server",
    "http.cookies",
    "http.cookiejar",
    "xmlrpc.server",
    "tkinter.colorchooser",
    "tkinter.font",
    "tkinter.messagebox",
    "tkinter.scrolledtext",
    "tkinter.dnd",
    "tkinter.ttk",
    "tkinter.tix",
    "unittest.mock"
]

function getSpecialCaseMapping(originalSymbol: string) {
    const symbol_parts = originalSymbol.split(".");

    if (originalSymbol.startsWith("typing.IO")){
        if ((new Set(["readinto", "read", "readall", "write"])).has(symbol_parts[2])){
            return `https://docs.python.org/3/library/io.html#io.RawIOBase.${symbol_parts[2]}`
        }
        else if ((new Set(["read1", "readinto", "readinto1"])).has(symbol_parts[2])){
            return `https://docs.python.org/3/library/io.html#io.BufferedIOBase.${symbol_parts[2]}`
        }
        else if ((new Set(["detach", "encoding", "errors", "newlines", "readline"])).has(symbol_parts[2])){
            return `https://docs.python.org/3/library/io.html#io.TextIOBase.${symbol_parts[2]}`
        }
        else {
            return `https://docs.python.org/3/library/io.html#io.IOBase.${symbol_parts[2]}`
        }
    }
    else if (originalSymbol.startsWith("builtins.list")){
        return "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists"
    }
    else if (originalSymbol.startsWith("builtins.tuple") || originalSymbol.startsWith("builtins.range")){
        return "https://docs.python.org/3/library/stdtypes.html#common-sequence-operations"
    }
    else if (originalSymbol.startsWith("builtins.set")){
        // `set` shares a section with `frozenset`, which is called `frozenset`
        return `https://docs.python.org/3/library/stdtypes.html#frozenset.${symbol_parts[2]}`
    }
    
    return null;
}

export function getPythonWebPageFromSymbol(symbol_name: string) {
    /**
     * Gets the helptext webpage for the given symbol name.
     * 
     * @returns A string of the webpage if one can be found, otherwise `null`.
     */
    const specialCaseMapping = getSpecialCaseMapping(symbol_name);
    if (specialCaseMapping){
        return specialCaseMapping
    }

    let module_name: string;
    let non_module_path: string;

    const symbol_parts = symbol_name.split(".");

    const submodule_with_separate_path = SUBMODULES_WITH_SEPARATE_PAGES.find(submodule => symbol_name.startsWith(submodule));
    if (submodule_with_separate_path !== undefined) {
        module_name = submodule_with_separate_path;
        non_module_path = symbol_parts.slice(1).join(".");
    }
    else {
        const special_case_submodule = Array.from(SPECIAL_CASE_PAGES.keys()).find(submodule => symbol_name.startsWith(submodule));

        if (special_case_submodule !== undefined){
            module_name = special_case_submodule;
            non_module_path = symbol_parts.slice(1).join(".");
        }
        else{
            module_name = symbol_parts[0];
            non_module_path = symbol_parts.slice(1).join(".");
        }
    }

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
    else if (builtInModules.has(module_name.split(".")[0])){
        return `https://docs.python.org/3/library/${module_name}.html#${symbol_name}`
    }

    return null;
}
