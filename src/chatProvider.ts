import * as vscode from 'vscode';
import OpenAI from "openai";
import path from 'path';
import { getWebviewContent } from './utils';

export class GPT4oWebviewViewProvider implements vscode.WebviewViewProvider {
    private context: vscode.ExtensionContext; // Add context as a class property
    public originalUri: vscode.Uri | null = null;
    public refactoredUri: vscode.Uri | null = null;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this.context = context; // Assign context
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        const theme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light';

        // Load the HTML content
        webviewView.webview.html = getWebviewContent(this._extensionUri, webviewView.webview, theme);

        // Handle messages from the WebView
        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.type === 'getOpenFiles') {
                const openFiles = this.getOpenFiles();
                webviewView.webview.postMessage({ type: 'fileList', files: openFiles });
            }

            if (message.type === 'askGPT') {
                const response = await this.askChatGPT(message.text, message.files);
                webviewView.webview.postMessage({ type: 'response', text: response });
            }

            if (message.type === 'refactorFiles') {
                const { refactoredCode, comments } = await this.refactorFiles(message.files, message.text);
                
                if (!refactoredCode || !comments) {
                    vscode.window.showErrorMessage('Failed to refactor files. Please try again.');
                    return;
                }

                const formattedComments = comments.replace(/\n/g, '<br>');

                webviewView.webview.postMessage({ 
                    type: 'refactorResponse', 
                    comments: formattedComments 
                });

                // Apply the refactored code and show in diff view
                await this.applyRefactoredCodeToFiles(message.files[0], refactoredCode);
            }

            if (message.type === 'copyPrompt') {
                await this.copyPrompt(message.text, message.files);
            }

            if (message.type === 'copyFiles') {
                await this.copyFilesOnly(message.files);
            }

            if (message.type === 'loadHelp') {
                const helpContent = await this.getHelpContent();
                webviewView.webview.postMessage({ type: 'response', text: helpContent });
            }


        });
    }

    // Get the list of currently open files in the workspace
    private getOpenFiles(): { fullPath: string, displayName: string }[] {
        const openTextDocuments = vscode.workspace.textDocuments;
        const fileCounts: { [fileName: string]: number } = {}; // Track how often each file name appears
    
        const files = openTextDocuments
            .map(doc => doc.uri.fsPath)
            .filter(filePath => 
                !filePath.includes('/.git/') &&
                !filePath.includes('/node_modules/') &&
                !filePath.startsWith('.') &&
                !filePath.endsWith('.lock') &&
                path.extname(filePath) !== '' // Ensure the file has an extension
            );
    
        // Build a count of how many times each file name occurs
        files.forEach(filePath => {
            const fileName = path.basename(filePath);
            fileCounts[fileName] = (fileCounts[fileName] || 0) + 1;
        });
    
        // Adjust filenames to include more of the path if necessary for disambiguation
        const disambiguatedFiles = files.map(filePath => {
            const fileName = path.basename(filePath);
            if (fileCounts[fileName] > 1) {
                // If multiple files have the same name, include part of the directory structure
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
                const relativePath = path.relative(workspaceFolder, filePath);
                const splitPath = relativePath.split(path.sep);
                const displayName = splitPath.slice(-2).join(path.sep); // show the last two parts of the path for disambiguation
                return { fullPath: filePath, displayName };
            } else {
                return { fullPath: filePath, displayName: fileName };
            }
        });
    
        return disambiguatedFiles;
    }
    
    
    

    // Interact with ChatGPT API
    private async askChatGPT(question: string, files: string[]): Promise<string | null> {
        const apiKey = vscode.workspace.getConfiguration('chatgpt').get<string>('apiKey');
        const openai = new OpenAI({ apiKey });
        
        let model;
        if(files.length > 0) {
            model = vscode.workspace.getConfiguration('chatgpt').get<string>('modelChat') || 'gpt-4o-mini';
        } else {
            model = vscode.workspace.getConfiguration('chatgpt').get<string>('modelChatWithFiles') || 'gpt-4o-mini';
        }
        

        let fileContents = '';

        // Optionally include file content in the prompt
        if (files.length > 0) {
            const fileContentsArray = await Promise.all(
                files.map(async file => {
                    const content = await this.getFileContent(file);
                    return `### File: ${file}\n${content}`;
                })
            );
            fileContents = fileContentsArray.join('\n\n');
        }

        const fullPrompt = `
        ### Context:
        You are a helpful coding assistant. I will provide you with some code files, and I need your support in understanding or manipulating the code. 
        
        ### Files Included:
        ${fileContents}
        
        ### User Question:
        ${question}
        
        ### Instructions:
        - When providing code, wrap it in language-specific code blocks (e.g., \`\`\`javascript or \`\`\`python).
        - Do not include explanations in the middle of the code; provide them outside the code blocks.
        - Format the code as follows:
          \`\`\`[language]
          // Code goes here
          \`\`\`
        - Return clean and concise answers, avoiding unnecessary repetition.
        `;
        

        try {
            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: fullPrompt },
                ],
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('Error:', error);
            return `Error: ${error}`;
        }
    }

    private async refactorFiles(files: string[], userInput?: string): Promise<{ refactoredCode: string | null, comments: string | null }> {
        const apiKey = vscode.workspace.getConfiguration('chatgpt').get<string>('apiKey');
        const openai = new OpenAI({ apiKey });
        const model = vscode.workspace.getConfiguration('chatgpt').get<string>('modelRefactor') || 'gpt-4o-mini';
    
        let fileContents = '';
    
        const fileContentsArray = await Promise.all(
            files.map(async file => {
                const content = await this.getFileContent(file);
                return `### File: ${file}\n${content}`;
            })
        );
        fileContents = fileContentsArray.join('\n\n');
    
        // Add user input to the prompt if it exists, otherwise use the default prompt.
        const userPrompt = userInput ? `\n\n${userInput}` : '';
    
        const fullPrompt = `
        You are an experienced software engineer assisting me in refactoring code. 
    
        **Important**:
        1. Provide only the refactored code wrapped between the tags: "<code>" and "</code>".
        2. **Do not include any comments inside the code block.** All explanations, comments, and justifications for the changes should be provided in the "<comments>" section.
        3. Provide detailed comments about the changes wrapped between the tags: "<comments>" and "</comments>".
        4. Make sure the response format is exactly as follows.
    
        **Example Output**:
        <code>
        // Refactored code goes here without any additonal comments explaining the changes.
        </code>
    
        <comments>
        - Comment 1: Explanation of the changes.
        - Comment 2: Additional explanations if needed.
        </comments>

        **Additional Input**:        
        ${userPrompt}
    
         **Provided Code**: 
        ${fileContents}
        `;
    
        try {
            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant that provides refactors." },
                    { role: "user", content: fullPrompt },
                ],
            });
    
            const response = completion.choices[0].message.content;
            if (!response) {
                console.error('No response from ChatGPT');
                return { refactoredCode: null, comments: null };
            }
    
            // Extract code and comments between their respective tags
            const refactoredCode = this.extractBlock(response, 'code');
            const comments = this.extractBlock(response, 'comments');
    
            return { refactoredCode, comments };
        } catch (error) {
            console.error('Error:', error);
            return { refactoredCode: null, comments: null };
        }
    }

    private async copyPrompt(question: string, files: string[]) {
        const fileContentsArray = await Promise.all(
            files.map(async file => {
                const content = await this.getFileContent(file);
                return `### File: ${file}\n${content}`;
            })
        );
        const fileContents = fileContentsArray.join('\n\n');
    
        const fullPrompt = `
        ### Context:
        You are a helpful coding assistant. I will provide you with some code files, and I need your support in understanding or manipulating the code. 
    
        ### Files Included:
        ${fileContents}
    
        ### User Question:
        ${question}
        `;
    
        if (fullPrompt) {
            // Copy the full prompt to clipboard
            await vscode.env.clipboard.writeText(fullPrompt);
            vscode.window.showInformationMessage("Prompt copied to clipboard.");
        } else {
            vscode.window.showErrorMessage("Failed to copy prompt.");
        }
    }

    private async copyFilesOnly(files: string[]) {
        const fileContentsArray = await Promise.all(
            files.map(async file => {
                const content = await this.getFileContent(file);
                // Format however you'd like. For example:
                return `### File: ${file}\n${content}`;
            })
        );
        const fileContents = fileContentsArray.join('\n\n');
    
        if (fileContents) {
            // Write the attached files to the system clipboard
            await vscode.env.clipboard.writeText(fileContents);
            vscode.window.showInformationMessage("Attached files copied to clipboard.");
        } else {
            vscode.window.showErrorMessage("Failed to copy attached files.");
        }
    }

    private async getHelpContent(): Promise<string> {
        try {
            const helpUri = vscode.Uri.joinPath(this._extensionUri, 'docs', 'help.md');
            const helpContentUint8Array = await vscode.workspace.fs.readFile(helpUri);
            return new TextDecoder("utf-8").decode(helpContentUint8Array);
        } catch (error) {
            console.error('Error reading help.md file:', error);
            return `Error: Unable to load help.md.`;
        }
    }
    

    // Helper function to extract blocks between specific tags
    private extractBlock(response: string, tag: string): string | null {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
        const match = response.match(regex);
        if (match && match[1]) {
            return match[1].trim();
        }
        return null;
    }

    private async applyRefactoredCodeToFiles(filePath: string, refactoredCode: string): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        // Resolve the file path, handling WSL and remote environments correctly
        let absoluteFilePath: vscode.Uri;

        if (path.isAbsolute(filePath)) {
            absoluteFilePath = vscode.Uri.file(filePath);
        } else {
            absoluteFilePath = vscode.Uri.joinPath(workspaceFolder, filePath);
        }

        const fileUri = this.resolveWSLPath(absoluteFilePath);

        try {
            const refactoredFileName = `${path.basename(filePath)}.refactored`;
            const refactoredUri = vscode.Uri.file(path.join(workspaceFolder.fsPath, refactoredFileName));
            await vscode.workspace.fs.writeFile(refactoredUri, Buffer.from(refactoredCode, 'utf8'));
            await vscode.languages.setTextDocumentLanguage(await vscode.workspace.openTextDocument(refactoredUri), 'typescript');

            // Store URIs for later merging
            this.originalUri = fileUri;    // Store original file URI
            this.refactoredUri = refactoredUri;  // Store refactored file URI

            // Show diff and let the user manually edit both files
            await vscode.commands.executeCommand('vscode.diff', fileUri, refactoredUri, `Diff: ${path.basename(filePath)}`);

            vscode.window.showInformationMessage("When you're done editing, use 'Save and Merge Refactored File' to apply your changes.");
            this.showMergeButton();

        } catch (error) {
            console.error(`Error applying refactored code to ${filePath}:`, error);
            vscode.window.showErrorMessage(`Error applying refactored code to ${filePath}: ${error}`);
        }
    }

    private showMergeButton() {
        // Add button to status bar
        const mergeButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        mergeButton.text = "$(git-merge) Merge Refactored File";
        mergeButton.tooltip = "Click to merge the refactored file into the original file";
        mergeButton.command = "extension.mergeRefactoredFile";  // The command is already registered
        mergeButton.show();
    
        // Dispose the button when no longer needed
        this.context.subscriptions.push(mergeButton);
    }

    public async mergeRefactoredFile(originalUri: vscode.Uri, refactoredUri: vscode.Uri): Promise<void> {
        try {
            const refactoredDocument = await vscode.workspace.openTextDocument(refactoredUri);
            const refactoredContent = refactoredDocument.getText();

            const originalDocument = await vscode.workspace.openTextDocument(originalUri);
            const originalEditor = await vscode.window.showTextDocument(originalDocument, { preview: false });

            const entireRange = new vscode.Range(
                originalDocument.positionAt(0),
                originalDocument.positionAt(originalDocument.getText().length)
            );

            await originalEditor.edit(editBuilder => {
                editBuilder.replace(entireRange, refactoredContent);
            });

            // Clean up the refactored file
            await vscode.workspace.fs.delete(refactoredUri);
            vscode.window.showInformationMessage(`Changes successfully merged to ${path.basename(originalUri.fsPath)}.`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error merging refactored file: ${error}`);
        }
    }

    // Read file content as a string
    private async getFileContent(filePath: string): Promise<string> {
        try {
            const fileUri = vscode.Uri.parse(filePath); // Handle WSL paths
            const fileStat = await vscode.workspace.fs.stat(fileUri); // Check if file exists

            if (!fileStat) {
                throw new Error(`File does not exist: ${filePath}`);
            }

            const fileContentUint8Array = await vscode.workspace.fs.readFile(fileUri);
            return new TextDecoder("utf-8").decode(fileContentUint8Array);
        } catch (error) {
            console.error('Error reading file:', error);
            return `Error reading file: ${filePath}`;
        }
    }

    private resolveWSLPath(uri: vscode.Uri): vscode.Uri {
        const scheme = uri.scheme;
    
        // If we're working in a WSL environment, ensure the URI uses the correct format
        if (scheme === 'vscode-remote') {
            // VSCode Remote (WSL or SSH) URIs need to remain unchanged
            return uri;
        }
    
        // For local file URIs, just return as-is
        return vscode.Uri.file(uri.fsPath);
    }
}
