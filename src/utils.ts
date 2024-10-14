import * as vscode from 'vscode';

export function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview, theme: string): string {
    const scriptPathOnDisk = vscode.Uri.joinPath(extensionUri, 'webview', 'scripts.js');
    const stylePathOnDisk = vscode.Uri.joinPath(extensionUri, 'webview', 'styles.css');

    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(stylePathOnDisk);

    const choicesUri = 'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js';
    const choicesCssUri = 'https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css';
    const markedUri = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';

    // Load Prism.js themes based on the theme
    const prismDarkCssUri = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/themes/prism-tomorrow.min.css';
    const prismLightCssUri = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/themes/prism.min.css';
    const prismCssUri = theme === 'dark' ? prismDarkCssUri : prismLightCssUri;

    const prismJsUri = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/prism.min.js';

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GPT 4o Chat</title>
            <link rel="stylesheet" href="${choicesCssUri}">
            <link rel="stylesheet" href="${styleUri}">
            <link rel="stylesheet" href="${prismCssUri}">
        </head>
        <body>
            <div id="chat-container">
                <div class="search-bar">
                    <input type="text" id="searchInput" placeholder="Search..." />
                    <button id="searchPrev"></button>
                    <button id="searchNext"></button>
                </div>
                <div id="response" class="chat-box"></div>
                <div class="input-section">
                    <div class="file-select-container">
                        <label for="fileSelect" class="file-select-label">Attach Files</label>
                        <select id="fileSelect" multiple></select>
                        <div id="menu-button" class="menu-button">⋮</div>
                    </div>
                    <div class="input-area">
                        <textarea id="input" placeholder="Ask ChatGPT..." class="chat-input"></textarea>
                        <div id="action-menu" class="action-menu hidden">
                            <div id="clearHistoryOption" class="menu-item">Clear Message History</div>
                            <div id="refactorOption" class="menu-item">Refactor</div>
                            <div id="copyPromptOption" class="menu-item">Copy Prompt</div>
                            <div id="helpOption" class="menu-item">Help</div>
                        </div>
                    </div>
                </div>
            </div>
            <script src="${markedUri}"></script>
            <script src="${choicesUri}"></script>
            <script src="${prismJsUri}"></script>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
}
