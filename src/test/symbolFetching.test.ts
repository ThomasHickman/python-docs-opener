import * as assert from 'assert';
import { HelpFetcher } from '../internals';
import * as fsPromise from "fs/promises";
import path = require('path');
import os = require('os');
import { getPythonWebPageFromSymbol } from '../getPythonWebPageFromSymbol';



suite("symbol fetching", () => {
    let helpFetcher: HelpFetcher;

    async function getWebpageFromString(str: string, line: number, column: number): Promise<string | null> {
        const tempFolder = await fsPromise.mkdtemp(path.join(os.tmpdir(), "getWebpageFromString"));
        const testFile = path.join(tempFolder, "testFile");
        await fsPromise.writeFile(testFile, str);
        
        const functionAtPosition = await helpFetcher.getFunctionAtPosition(testFile, line, column);
        console.log(`Found function ${functionAtPosition}`)

        if (functionAtPosition)
            return getPythonWebPageFromSymbol(functionAtPosition);
        else
            return null;
    }

    setup(async () => {
        helpFetcher = new HelpFetcher(path.resolve(__dirname, "..", "..", "venv", "bin", "python3"));
    })

    test("open", async () => {
        assert.strictEqual(await getWebpageFromString("open", 1, 2), "https://docs.python.org/3/library/functions.html#open");
    })

    test("sys.executable", async () => {
        assert.strictEqual(await getWebpageFromString("import sys;sys.executable", 1, 18), "https://docs.python.org/3/library/sys.html#sys.executable");
    })
    
    test("capitalize", async () => {    
        assert.strictEqual(await getWebpageFromString("''.capitalize", 1, 5), "https://docs.python.org/3/library/stdtypes.html#str.capitalize");
    })

    test("sys.stdout", async () => {
        assert.strictEqual(await getWebpageFromString("import sys;sys.stdout", 1, 17), "https://docs.python.org/3/library/sys.html#sys.stdout");
    })

    test("List.insert", async () => {
        assert.strictEqual(await getWebpageFromString("[].insert", 1, 5), "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists");
    })

    test("Tuple.count", async () => {
        assert.strictEqual(await getWebpageFromString("().count", 1, 5), "https://docs.python.org/3/library/stdtypes.html#common-sequence-operations");
    })

    test("Set.update", async () => {
        assert.strictEqual(await getWebpageFromString("set().update", 1, 8), "https://docs.python.org/3/library/stdtypes.html#frozenset.update");
    })

    test("IO.writelines", async () => {
        assert.strictEqual(await getWebpageFromString("open('file').writelines([])", 1, 15), "https://docs.python.org/3/library/io.html#io.IOBase.writelines");
    })

    test("unittest.mock", async () => {
        assert.strictEqual(await getWebpageFromString("from unittest import mock; mock.Mock", 1, 34), "https://docs.python.org/3/library/unittest.mock.html#unittest.mock.Mock");
    })

    test("__file__", async () => {
        assert.strictEqual(await getWebpageFromString("__file__", 1, 4), "https://docs.python.org/3/reference/import.html#file__");
    })

    test("class.__instancecheck__", async () => {
        assert.strictEqual(await getWebpageFromString("class X:pass;\nX.__instancecheck__", 2, 3), "https://docs.python.org/3/reference/datamodel.html#class.__instancecheck__");
    })

    test("object.__lt__", async () => {
        assert.strictEqual(await getWebpageFromString("x = 3;x.__lt__", 1, 10), "https://docs.python.org/3/reference/datamodel.html#object.__lt__");
    })

    test("Mapping.get", async () => {
        assert.strictEqual(await getWebpageFromString("{}.get", 1, 4), "https://docs.python.org/3/library/collections.abc.html#collections-abstract-base-classes");
    })

    test("list", async () => {
        assert.strictEqual(await getWebpageFromString("list", 1, 2), "https://docs.python.org/3/library/stdtypes.html#list");
    })

    test("warnings.warn", async () => {
        assert.strictEqual(await getWebpageFromString("import warnings;warnings.warn", 1, 27), "https://docs.python.org/3/library/warnings.html#warnings.warn");
    })

    test("DeprecationWarning", async () => {
        assert.strictEqual(await getWebpageFromString("DeprecationWarning", 1, 6), "https://docs.python.org/3/library/exceptions.html#DeprecationWarning");
    })

    test("os.environ.get", async () => {
        assert.strictEqual(await getWebpageFromString("import os;os.environ.get", 1, 23), "https://docs.python.org/3/library/collections.abc.html#collections-abstract-base-classes");
    })

    test("typing.Optional", async () => {
        assert.strictEqual(await getWebpageFromString("import typing;typing.Optional", 1, 24), "https://docs.python.org/3/library/typing.html#typing.Optional");
    })

}).timeout(10_000)