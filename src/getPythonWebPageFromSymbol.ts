import { builtInModules } from "./data";

const MODULE_RENAMES = new Map([
    ["_collections_abc", "collections.abc"],
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

const ABC_CLASSES = new Set([
    "AsyncGenerator",
    "AsyncIterable",
    "AsyncIterator",
    "Awaitable",
    "ByteString",
    "Callable",
    "Collection",
    "Container",
    "Coroutine",
    "Generator",
    "Hashable",
    "ItemsView",
    "Iterable",
    "Iterator",
    "KeysView",
    "Mapping",
    "MappingView",
    "MutableMapping",
    "MutableSequence",
    "MutableSet",
    "Reversible",
    "Sequence",
    "Set",
    "Sized",
    "ValuesView",
])

export function getPythonWebPageFromSymbol(symbolName: string) {
    /**
     * Gets the helptext webpage for the given symbol name.
     * 
     * @returns A string of the webpage if one can be found, otherwise `null`.
     */

    let moduleName: string;
    let nonModulePath: string;

    const symbolParts = symbolName.split(".");

    const renamedModule = Array.from(MODULE_RENAMES.keys()).find(submodule => symbolName.startsWith(submodule));
    if (renamedModule !== undefined) {
        moduleName = MODULE_RENAMES.get(renamedModule)!;
        nonModulePath = symbolName.slice(renamedModule.length + 1);
    }
    else {
        const submoduleWithSeparatePath = SUBMODULES_WITH_SEPARATE_PAGES.find(submodule => symbolName.startsWith(submodule));
        
        if (submoduleWithSeparatePath !== undefined){
            moduleName = submoduleWithSeparatePath;
            nonModulePath = symbolName.slice(submoduleWithSeparatePath.length + 1);
        }
        else{
            moduleName = symbolParts[0];
            nonModulePath = symbolParts.slice(1).join(".");
        }
    }

    const resolvedSymbol = `${moduleName}.${nonModulePath}`;
    const lastSymbolPart = symbolParts[symbolParts.length - 1];
    const nonModuleParts = nonModulePath.split(".");

    if (moduleName == "__import_system__") {
        return `https://docs.python.org/3/reference/import.html#${nonModuleParts[0].slice(2)}`
    }
    else if (resolvedSymbol.startsWith("typing.IO.")){
        if ((new Set(["readinto", "read", "readall", "write"])).has(nonModuleParts[1])){
            return `https://docs.python.org/3/library/io.html#io.RawIOBase.${nonModuleParts[1]}`
        }
        else if ((new Set(["read1", "readinto", "readinto1"])).has(nonModuleParts[1])){
            return `https://docs.python.org/3/library/io.html#io.BufferedIOBase.${nonModuleParts[1]}`
        }
        else if ((new Set(["detach", "encoding", "errors", "newlines", "readline"])).has(nonModuleParts[1])){
            return `https://docs.python.org/3/library/io.html#io.TextIOBase.${nonModuleParts[1]}`
        }
        else {
            return `https://docs.python.org/3/library/io.html#io.IOBase.${nonModuleParts[1]}`
        }
    }
    else if (resolvedSymbol.startsWith("builtins.list.")){
        return "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists"
    }
    else if (resolvedSymbol.startsWith("builtins.tuple.") || resolvedSymbol.startsWith("builtins.range")){
        return "https://docs.python.org/3/library/stdtypes.html#common-sequence-operations"
    }
    else if (resolvedSymbol.startsWith("builtins.set.")){
        // `set` shares a section with `frozenset`, which is called `frozenset`
        return `https://docs.python.org/3/library/stdtypes.html#frozenset.${nonModuleParts[1]}`
    }
    else if ((moduleName == "typing" || moduleName == "collections.abc") && ABC_CLASSES.has(nonModuleParts[0]) && nonModuleParts.length == 2){
        return `https://docs.python.org/3/library/collections.abc.html#collections-abstract-base-classes`
    }
    else if (lastSymbolPart.startsWith("__") && lastSymbolPart.endsWith("__")) {
        if ((new Set(["__instancecheck__", "__subclasscheck__"]).has(lastSymbolPart))){
            return `https://docs.python.org/3/reference/datamodel.html#class.${lastSymbolPart}`
        }
        else{
            return `https://docs.python.org/3/reference/datamodel.html#object.${lastSymbolPart}`
        }
    }

    if (moduleName === "builtins") {
        // TODO: find a way to represent from here onwards: https://docs.python.org/3/library/stdtypes.html#contextmanager.__enter__
        const stdtypes = new Set(["int", "float", "complex", "list", "tuple", "range", "str", "bytes, bytearray", "memoryview", "set", "frozenset", "dict"]);

        if (stdtypes.has(nonModuleParts[0])) {
            return `https://docs.python.org/3/library/stdtypes.html#${nonModulePath}`
        }

        // TODO: the constants/exceptions/functions handling is not complete and bit brittle. We could make this better.

        if (symbolParts.length == 2) {
            // Handle built in functions and constants
            const python_constants = new Set(["False", "True", "None", "NotImplemented", "Ellipsis", "__debug__", "quit", "copyright", "credits", "license"]);

            if (python_constants.has(nonModuleParts[0])) {
                return `https://docs.python.org/3/library/constants.html#${nonModuleParts[0]}`
            }
            else if (nonModuleParts[0].endsWith("Exception")
                || nonModuleParts[0].endsWith("Error")
                || nonModuleParts[0].endsWith("Exit")
                || nonModuleParts[0].endsWith("Warning")
                || nonModuleParts[0].endsWith("Interrupt")) {
                return `https://docs.python.org/3/library/exceptions.html#${nonModuleParts[0]}`
            }
            else {
                return `https://docs.python.org/3/library/functions.html#${nonModuleParts[0]}`
            }

            throw Error("AssertionError: all paths here should return.")
        }
    }
    else {
        let moduleNoUnderscore = moduleName;
        if (moduleName[0] == "_") {
            moduleNoUnderscore = moduleName.slice(1);
        }

        if (builtInModules.has(moduleNoUnderscore.split(".")[0])){
            return `https://docs.python.org/3/library/${moduleNoUnderscore}.html#${moduleNoUnderscore}.${nonModulePath}`
        }
    }

    return null;
}
