import * as vscode from 'vscode';
import OpenAI from "openai";

export function activate(context: vscode.ExtensionContext) {
    console.log('ChatGPT extension activated');

    // Register the webview view provider for the sidebar view
    const chatProvider = new GPT4oWebviewViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('gpt4oChatView', chatProvider)
    );

    console.log('Webview provider registered for GPT 4o Chat');
}

class GPT4oWebviewViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {
        console.log('GPT4oWebviewViewProvider initialized');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        console.log('Resolving webview for GPT 4o Chat');
        webviewView.webview.options = {
            enableScripts: true
        };

        // Set the webview content (HTML with a chat interface)
        webviewView.webview.html = this.getWebviewContent();
        console.log('Webview content set');

        // Handle messages from the webview (when the user sends a message)
        webviewView.webview.onDidReceiveMessage(async message => {
            if (message.type === 'askGPT') {
                console.log('Received message from webview:', message.text);
                const response = await this.askChatGPT(message.text);
                webviewView.webview.postMessage({ type: 'response', text: response });
                console.log('Sent response back to webview');
            }
        });
    }

    // Function to generate the HTML content for the webview (chat interface)
    private getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GPT 4o Chat</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        display: flex;
                        flex-direction: column;
                        height: calc(100vh - 20px);
                        overflow: hidden;
                    }
                    #response {
                        flex-grow: 1;
                        overflow-y: auto;
                        padding: 10px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        border-radius: 5px;
                        border: 1px solid var(--vscode-input-border);
                    }
                    textarea {
                        width: 100%;
                        height: 60px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        resize: none;
                    }
                    button {
                        padding: 10px 20px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        cursor: pointer;
                        margin-top: 10px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .response-item {
                        margin-top: 10px;
                        padding: 10px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        border-radius: 5px;
                        border: 1px solid var(--vscode-input-border);
                    }
                    .response-item.user {
                        background-color: #2c2c2c;  /* Dark grey background */
                        color: white;
                        text-align: right;
                        border: 1px solid #2c2c2c;
                    }
                    .loading {
                        font-style: italic;
                        opacity: 0.7;
                    }
                    .truncated {
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: normal;
                    }
                    .show-more {
                        cursor: pointer;
                        color: #007acc;
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div id="response"></div>
                <textarea id="input" placeholder="Ask ChatGPT..."></textarea>
                <button id="askButton">Send</button>
    
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <script>
                    const vscode = acquireVsCodeApi();
                    let isLoading = false;
    
                    document.getElementById('askButton').addEventListener('click', () => {
                        const input = document.getElementById('input').value;
                        if (!input.trim() || isLoading) return;  // Prevent empty messages or multiple requests
    
                        isLoading = true;
                        addLoadingIndicator();
    
                        // Show the user's question in the chat
                        addMessageToChat(input, true);
                        vscode.postMessage({ type: 'askGPT', text: input });
    
                        document.getElementById('input').value = ''; // Clear input after sending
                    });
    
                    document.getElementById('input').addEventListener('keydown', function(event) {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();  // Prevent new line
                            document.getElementById('askButton').click();
                        }
                    });
    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'response') {
                            removeLoadingIndicator();
                            addMessageToChat(message.text, false);
                            isLoading = false;
                        }
                    });
    
                    function addMessageToChat(text, isUser) {
                        const responseDiv = document.getElementById('response');
                        const newResponse = document.createElement('div');
                        newResponse.className = 'response-item' + (isUser ? ' user' : '');
    
                        const content = isUser ? marked.parse(text) : marked.parse(text);
                        newResponse.innerHTML = getTruncatedMessage(content, isUser);
    
                        responseDiv.appendChild(newResponse);
                        responseDiv.scrollTop = responseDiv.scrollHeight;  // Auto scroll to bottom
                    }
    
                    function getTruncatedMessage(content, isUser) {
                        const maxLines = 3;  // Show max 3 lines for long messages
                        const div = document.createElement('div');
                        div.className = 'truncated';
                        div.innerHTML = content;
    
                        if (div.scrollHeight > div.clientHeight) {
                            div.classList.remove('truncated');
                            div.innerHTML += isUser ? '' : '<span class="show-more">Show more</span>';
                        }
    
                        div.addEventListener('click', (e) => {
                            if (e.target.classList.contains('show-more')) {
                                div.classList.remove('truncated');
                                e.target.remove();  // Remove "Show more" after expanding
                            }
                        });
    
                        return div.outerHTML;
                    }
    
                    function addLoadingIndicator() {
                        const responseDiv = document.getElementById('response');
                        const loadingIndicator = document.createElement('div');
                        loadingIndicator.id = 'loading';
                        loadingIndicator.className = 'response-item loading';
                        loadingIndicator.textContent = 'Thinking...';
                        responseDiv.appendChild(loadingIndicator);
                        responseDiv.scrollTop = responseDiv.scrollHeight;
                    }
    
                    function removeLoadingIndicator() {
                        const loadingIndicator = document.getElementById('loading');
                        if (loadingIndicator) loadingIndicator.remove();
                    }
                </script>
            </body>
            </html>
        `;
    }

    // Function to interact with the ChatGPT API
    private async askChatGPT(question: string): Promise<string | null> {
        const apiKey = vscode.workspace.getConfiguration('chatgpt').get<string>('apiKey');
        const openai = new OpenAI({
            apiKey: apiKey 
        });

        console.log('API key: ',apiKey);
        console.log('Asking ChatGPT:', question);
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4",  // Corrected the model name
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: question }, 
                ],
            });

            console.log('Received response from ChatGPT:', completion.choices[0].message.content);
            return completion.choices[0].message.content;  // Return only the message content
        } catch (error) {
            console.error('Error:', error);
            return `Error: ${error}`;
        }
    }
}

export function deactivate() {
    console.log('ChatGPT extension deactivated');
}
