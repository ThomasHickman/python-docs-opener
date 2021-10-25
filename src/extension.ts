// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {getFunctionAtPosition, getDocWebPageFromSymbol, HelpFetcher} from "./internals";
import * as openInDefaultBrowser from "open";

let helpFetcher: HelpFetcher;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const logs = vscode.window.createOutputChannel("python-help-fetcher logs");
	helpFetcher = new HelpFetcher();

	let disposable = vscode.commands.registerCommand('python-help-fetcher.getDocsOfSymbol', async () => {
		const editor  = vscode.window.activeTextEditor;

		logs.appendLine("Command triggered");

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			const symbolAtPosition = await helpFetcher.getFunctionAtPosition(document.fileName, selection.active.line + 1, selection.active.character + 1);
			const webpage = getDocWebPageFromSymbol(symbolAtPosition);

			if (webpage === null){
				vscode.window.showWarningMessage(`Cannot get documentation for "${symbolAtPosition}". Querying non-python libraries is not supported.`);
			}
			else{
				await openInDefaultBrowser(webpage);
			}
		}
		else {
			vscode.window.showErrorMessage(`No detected editor is opened so cannot query the symbol.`);
		}
		
	});


	context.subscriptions.push(disposable);
}

export function deactivate() {
	helpFetcher.destroy();
}
