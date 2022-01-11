import child_process = require("child_process");
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

        return webpageTemplate.replace("${symbol_name}", symbol_name);
    }
    else{
        return null;
    }
}
