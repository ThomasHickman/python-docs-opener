// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {getPythonWebPageFromSymbol, getWebPageFromSymbolUsingSettings, HelpFetcher} from "./internals";
import * as fs_p from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process"

let helpFetcherPromise: Promise<HelpFetcher>;


export function runProcess(name: string, args: string[], options: child_process.ExecFileOptions = {}): Promise<child_process.ChildProcess>{
    return new Promise((resolve, reject) => {
        let process: child_process.ChildProcess | undefined = undefined;
        process = child_process.execFile(name, args, {}, (error, stdout, stderr) => {
            if (process){
                resolve(process);
            }
            else{
                reject(Error("No process generated by execFile!"));
            }
        })
    })
}

export async function getPythonExecutableWithJedi(venvFolder: string): Promise<string> {
    const potentialPythonPath = path.join(venvFolder, "bin", "python3");

    if (await fs_p.access(potentialPythonPath, fs.constants.F_OK).then(_ => true).catch(_ => false)) {
        const testCommand = await runProcess(potentialPythonPath, ["-c", "import jedi"]);
        // If the folder is in an invalid state (maybe from before where there was no internet), remove it and retry.
        if (testCommand.exitCode != 0){
            await fs_p.rm(venvFolder, {recursive: true, force: true});
            return await getPythonExecutableWithJedi(venvFolder);
        }
        
        
        return potentialPythonPath;
    }
    else {
        // This should error with the exit code
        const virtualEnvProcess = await runProcess("virtualenv", [venvFolder]);
        if (virtualEnvProcess.exitCode != 0) {
            vscode.window.showErrorMessage(`Creating a virtualenv failed. stderr: ${virtualEnvProcess.stderr?.read()}`)
        }

        const jediInstalled = await runProcess(potentialPythonPath, ["-m", "pip", "install", "jedi~=0.18"]);
        if (jediInstalled.exitCode != 0) {
            vscode.window.showErrorMessage(`Running "pip install jedi" failed. stderr: ${jediInstalled.stderr?.read()}`)
        }

        return potentialPythonPath;
    }
}

async function getPythonExecutableWithJediUsingExtension(extensionContext: vscode.ExtensionContext){
    /** Returns a path to a python executable with Jedi installed in the environment. This may be 
     * created in this function if this doesn't exist.
     *  */
    if (extensionContext.globalStorageUri.scheme != "file") {
        throw Error("globalStorageUri doesn't return a file object");
    }
    const globalStoragePath = extensionContext.globalStorageUri.fsPath;
    const potentialVenvPath = path.join(globalStoragePath, "venv");
    return await getPythonExecutableWithJedi(potentialVenvPath);
}

async function getHelpFetcher(context: vscode.ExtensionContext){
    const pythonExecutable = await getPythonExecutableWithJediUsingExtension(context);
    return new HelpFetcher(pythonExecutable);
}


export function activate(context: vscode.ExtensionContext) {
    helpFetcherPromise = getHelpFetcher(context);

    let disposable = vscode.commands.registerCommand('python-help-fetcher.getDocsOfSymbol', async () => {
        const editor = vscode.window.activeTextEditor;
        const helpFetcher = await helpFetcherPromise;

        if (editor) {
            const document = editor.document;
            const selection = editor.selection;

            const pythonPath = vscode.extensions.getExtension("ms-python.python")?.exports.settings.getExecutionDetails()?.execCommand[0]

            const symbolAtPosition = await helpFetcher.getFunctionAtPosition(
                document.fileName,
                selection.active.line + 1,
                selection.active.character + 1,
                pythonPath
            );
            if (!symbolAtPosition){
                vscode.window.showWarningMessage(
                    `Unable to get the documentation for the selected symbol. ` + 
                    `Please check the input file for errors.`
                );

                return;
            }
            else{
                let webpage = getPythonWebPageFromSymbol(symbolAtPosition);

                if (!webpage){
                    const additionalLibaries: object = vscode.workspace.getConfiguration().get("python-help-fetcher.additionalLibraryDocsMappings") ?? {};
                    
                    webpage = getWebPageFromSymbolUsingSettings(symbolAtPosition, additionalLibaries);

                    if (!webpage){
                        vscode.window.showWarningMessage(
                            `Unable to get the documentation for "${symbolAtPosition}". ` + 
                            `Fetching documentation for the library that provides this symbol may not be supported.`
                        );

                        return;
                    }
                }
                await vscode.env.openExternal(vscode.Uri.parse(webpage));
            }


        }
    });


    context.subscriptions.push(disposable);
}

export async function deactivate() {
    (await helpFetcherPromise).destroy();
}
