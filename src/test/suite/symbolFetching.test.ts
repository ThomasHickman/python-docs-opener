import * as assert from 'assert';
import { HelpFetcher, getPythonWebPageFromSymbol } from '../../internals';
import * as fs_p from "fs/promises";
import path = require('path');
import os = require('os');


describe("symbol fetching", () => {
    let helpFetcher: HelpFetcher;

    async function getWebpageFromString(str: string, line: number, column: number): Promise<string | null> {
        const tempFolder = await fs_p.mkdtemp(path.join(os.tmpdir(), "getWebpageFromString"));
        const testFile = path.join(tempFolder, "testFile");
        await fs_p.writeFile(testFile, str);
        
        const functionAtPosition = await helpFetcher.getFunctionAtPosition(testFile, line, column);
        console.log(`Found function ${functionAtPosition}`)

        if (functionAtPosition)
            return getPythonWebPageFromSymbol(functionAtPosition);
        else
            return null;
    }

    beforeEach(async () => {
        helpFetcher = new HelpFetcher(path.resolve(__dirname, "..", "..", "..", "venv", "bin", "python3"));
    })

    it("open", async () => {
        assert.strictEqual(await getWebpageFromString("open", 1, 2), "https://docs.python.org/3/library/functions.html#open");
    })

    it("sys.executable", async () => {
        assert.strictEqual(await getWebpageFromString("import sys;sys.executable", 1, 18), "https://docs.python.org/3/library/sys.html#sys.executable");
    })
    
    it("capitalize", async () => {    
        assert.strictEqual(await getWebpageFromString("''.capitalize", 1, 5), "https://docs.python.org/3/library/stdtypes.html#str.capitalize");
    })

    it("sys.stdout", async () => {
        assert.strictEqual(await getWebpageFromString("import sys;sys.stdout", 1, 17), "https://docs.python.org/3/library/sys.html#sys.stdout");
    })

    it("List.insert", async () => {
        assert.strictEqual(await getWebpageFromString("[].insert", 1, 5), "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists");
    })

    it("Tuple.count", async () => {
        assert.strictEqual(await getWebpageFromString("().count", 1, 5), "https://docs.python.org/3/library/stdtypes.html#common-sequence-operations");
    })

    it("Set.update", async () => {
        assert.strictEqual(await getWebpageFromString("set().update", 1, 8), "https://docs.python.org/3/library/stdtypes.html#frozenset.update");
    })

    it("IO.writelines", async () => {
        assert.strictEqual(await getWebpageFromString("open('file').writelines([])", 1, 15), "https://docs.python.org/3/library/io.html#io.IOBase.writelines");
    })

    it("unittest.mock", async () => {
        assert.strictEqual(await getWebpageFromString("from unittest import mock; mock.Mock", 1, 34), "https://docs.python.org/3/library/unittest.mock.html#unittest.mock.Mock");
    })
}).timeout(10_000)