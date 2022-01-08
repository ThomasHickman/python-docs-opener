import * as assert from 'assert';
import * as fsPromise from "fs/promises";
import path = require('path');
import os = require('os');

import * as extension from '../../extension';


describe("python environment management", () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fsPromise.mkdtemp(path.join(os.tmpdir(), "envManagementTest"));
    })

    afterEach(() => {
        fsPromise.rm(tempDir, { recursive: true, force: true });
    })

    it("a test environment can be created in a blank folder", async () => {
        const pythonPath = await extension.getPythonExecutableWithJedi(tempDir);
        const check = await extension.runProcess(pythonPath, ["-c", "import jedi"])
        assert.strictEqual(check.exitCode, 0);
    }).timeout(60_000);

    it("test environments can be fetched twice", async () => {
        const pythonPath = await extension.getPythonExecutableWithJedi(tempDir);
        const newPythonPath = await extension.getPythonExecutableWithJedi(tempDir);
        assert.strictEqual(pythonPath, newPythonPath);

        const check = await extension.runProcess(pythonPath, ["-c", "import jedi"]);
        assert.strictEqual(check.exitCode, 0);
    }).timeout(60_000);

    it("test environments can be created where creation has previously failed", async () => {
        await extension.runProcess("virtualenv", [tempDir]);

        const pythonPath = await extension.getPythonExecutableWithJedi(tempDir);
        const check = await extension.runProcess(pythonPath, ["-c", "import jedi"])
        assert.strictEqual(check.exitCode, 0);
    }).timeout(60_000);
})