import * as vscode from 'vscode';
import { GPT4oWebviewViewProvider } from './chatProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('ChatGPT extension activated');

    // Register the webview view provider for the sidebar view
    const chatProvider = new GPT4oWebviewViewProvider(context.extensionUri, context); // Pass context here
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('gpt4oChatView', chatProvider)
    );
    
    console.log('Webview provider registered for GPT 4o Chat');

    // Register the command to merge refactored file
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.mergeRefactoredFile', async () => {
            // Ensure the provider has the URIs for original and refactored files
            if (chatProvider.originalUri && chatProvider.refactoredUri) {
                await chatProvider.mergeRefactoredFile(chatProvider.originalUri, chatProvider.refactoredUri);
            } else {
                vscode.window.showErrorMessage("Cannot merge: No original or refactored file is available.");
            }
        })
    );
}

export function deactivate() {
    console.log('ChatGPT extension deactivated');
}
