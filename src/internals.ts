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
    const symbolParts = symbol_name.split(".");
    const moduleName = symbolParts[0];

    if ((new Set(Object.keys(setting_object))).has(moduleName)){
        const webpageTemplate: string = setting_object[moduleName];

        return webpageTemplate.replace("${symbol_name}", symbol_name)
                              .replace("${module_name}", moduleName);
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
    const symbolParts = originalSymbol.split(".");
    const lastSymbolPart = symbolParts[symbolParts.length - 1];

    if (symbolParts[0] == "__import_system__") {
        return `https://docs.python.org/3/reference/import.html#${symbolParts[1].slice(2)}`
    }
    else if (originalSymbol.startsWith("typing.IO")){
        if ((new Set(["readinto", "read", "readall", "write"])).has(symbolParts[2])){
            return `https://docs.python.org/3/library/io.html#io.RawIOBase.${symbolParts[2]}`
        }
        else if ((new Set(["read1", "readinto", "readinto1"])).has(symbolParts[2])){
            return `https://docs.python.org/3/library/io.html#io.BufferedIOBase.${symbolParts[2]}`
        }
        else if ((new Set(["detach", "encoding", "errors", "newlines", "readline"])).has(symbolParts[2])){
            return `https://docs.python.org/3/library/io.html#io.TextIOBase.${symbolParts[2]}`
        }
        else {
            return `https://docs.python.org/3/library/io.html#io.IOBase.${symbolParts[2]}`
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
        return `https://docs.python.org/3/library/stdtypes.html#frozenset.${symbolParts[2]}`
    }
    else if (lastSymbolPart.startsWith("__") && lastSymbolPart.endsWith("__")) {
        if ((new Set(["__instancecheck__", "__subclasscheck__"]).has(lastSymbolPart))){
            return `https://docs.python.org/3/reference/datamodel.html#class.${lastSymbolPart}`
        }
        else{
            return `https://docs.python.org/3/reference/datamodel.html#object.${lastSymbolPart}`
        }
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

    let moduleName: string;
    let nonModulePath: string;

    const symbolParts = symbol_name.split(".");

    const submoduleWithSeparatePath = SUBMODULES_WITH_SEPARATE_PAGES.find(submodule => symbol_name.startsWith(submodule));
    if (submoduleWithSeparatePath !== undefined) {
        moduleName = submoduleWithSeparatePath;
        nonModulePath = symbolParts.slice(1).join(".");
    }
    else {
        const specialCaseSubmodule = Array.from(SPECIAL_CASE_PAGES.keys()).find(submodule => symbol_name.startsWith(submodule));

        if (specialCaseSubmodule !== undefined){
            moduleName = specialCaseSubmodule;
            nonModulePath = symbolParts.slice(1).join(".");
        }
        else{
            moduleName = symbolParts[0];
            nonModulePath = symbolParts.slice(1).join(".");
        }
    }

    if (moduleName === "builtins") {
        // TODO: the constants/exceptions/functions handling is not complete and bit brittle. We could make this better.

        if (symbolParts.length == 2) {
            // Handle built in functions and constants
            const python_constants = new Set(["False", "True", "None", "NotImplemented", "Ellipsis", "__debug__", "quit", "copyright", "credits", "license"]);

            if (python_constants.has(symbolParts[1])) {
                return `https://docs.python.org/3/library/constants.html#${symbolParts[1]}`
            }
            else if (symbolParts[1].endsWith("Exception")
                || symbolParts[1].endsWith("Error")
                || symbolParts[1].endsWith("Exit")
                || symbolParts[1].endsWith("Interrupt")) {
                return `https://docs.python.org/3/library/exceptions.html#${symbolParts[1]}`
            }
            else {
                return `https://docs.python.org/3/library/functions.html#${symbolParts[1]}`
            }

            throw Error("AssertionError: all paths here should return.")
        }

        // TODO: find a way to represent from here onwards: https://docs.python.org/3/library/stdtypes.html#contextmanager.__enter__
        const stdtypes = new Set(["int", "float", "complex", "list", "tuple", "range", "str", "bytes, bytearray", "memoryview", "set", "frozenset", "dict"]);

        if (stdtypes.has(symbolParts[1])) {
            return `https://docs.python.org/3/library/stdtypes.html#${nonModulePath}`
        }
    }
    else if (builtInModules.has(moduleName.split(".")[0])){
        return `https://docs.python.org/3/library/${moduleName}.html#${symbol_name}`
    }

    return null;
}
