import { systemDefaultPlatform } from '@vscode/test-electron/out/util';
import * as assert from 'assert';
import * as fs_p from "fs/promises";
import path = require('path');
import os = require('os');
import { stdout } from 'process';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as extension from '../../extension';

// suite('Extension Test Suite', () => {
// 	vscode.window.showInformationMessage('Start all tests.');

// 	test('Sample test', () => {
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
// 		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
// 	});
// });


describe("python environment management", () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fs_p.mkdtemp(path.join(os.tmpdir(), "envManagementTest"));
    })

    afterEach(() => {
        fs_p.rm(tempDir, { recursive: true, force: true });
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