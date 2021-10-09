// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const logs = vscode.window.createOutputChannel("python-help-fetcher logs");
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "python-help-fetcher" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('python-help-fetcher.getDocsOfSymbol', () => {
		const editor  = vscode.window.activeTextEditor;

		logs.appendLine("Command triggered")
		logs.show();

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			const wordSelected = document.getText(selection);
			vscode.window.showInformationMessage(`Word selected: ${wordSelected} at line ${selection.active.line}`);
		}
		
	});


	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
