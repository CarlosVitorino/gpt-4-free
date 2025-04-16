# GPT4free Code Assistant - Free Version

Unlock the power of AI-driven development with **GPT4free Code Assistant**! This VSCode extension brings the capabilities of OpenAI's GPT models directly into your coding environment. Whether you're looking to refactor code, ask questions, or generate new snippets, GPT4free provides intelligent, context-aware insights that enhance your coding productivity.

## Key Features

- **AI-Powered Chat Interface**: Engage in real-time conversations with GPT models directly from VSCode.
- **Contextual Code Understanding**: Attach open files to give GPT more context for deeper, code-specific insights.
- **Automated Code Refactoring**: Request refactoring and receive clean, optimized code suggestions with explanations.
- **Instant Prompt Copying**: Easily copy constructed prompts for use outside the extension or to further refine your queries.
- **Searchable Chat History**: Seamlessly navigate through your chat history to find previous interactions.
- **VSCode Theme Support**: Enjoy a user interface that adapts to your light or dark theme preference.

## How to Use

### 1. Installation
- **Step 1**: Install the extension from the VSCode marketplace (or manually from a `.vsix` file).
- **Step 2**: Add your OpenAI API key in the settings to activate GPT-powered interactions.
  
### 2. Setup Your API Key
- **Open Settings**: Go to `File > Preferences > Settings` (or press `Ctrl + ,`).
- **Search for**: `GPT4o Code Assistant API Key`.
- **Enter Your API Key**: Input your OpenAI API key to unlock the AI features.

### 3. Start Chatting with GPT4o
- **Access the Chat Interface**: Click on the GPT4o icon in the VSCode sidebar to open the chat panel.
- **Ask Questions**: Type your question in the chat input and hit `Enter`.
- **Attach Files for Context**: Use the file selector to attach open files for better AI-driven context in your queries.

### 4. Refactor Code
- **Request Refactoring**: Provide

### Screenshots

![Extension Screenshot](https://i.imgur.com/mZJtXOQ.png)

> This is an example of the chat interface with attached files for context-based AI interactions.

## Requirements

- **OpenAI API Key**: You will need an OpenAI API key to use the GPT features. You can get one by signing up on the [OpenAI website](https://openai.com/).
- **VS Code Version**: This extension requires Visual Studio Code version 1.50.0 or higher.

## Extension Settings

This extension contributes the following settings:

- `chatgpt.apiKey`: The OpenAI API key used to interact with GPT models.
- `chatgpt.baseFolder`: Defines the base folder from which to gather files.
- `chatgpt.modelChat`: Select the ChatGPT model to use for standard interactions (e.g., `gpt-4`, `gpt-3.5-turbo`).
- `chatgpt.modelChatWithFiles`: Select the ChatGPT model for interactions that include files.
- `chatgpt.modelRefactor`: Choose the model for requesting code refactoring.

To configure these settings, go to the settings menu (`Ctrl+,` or `Cmd+,`) and search for "chatgpt".


## How to Use

1. **Open the Chat**: Open the chat view by selecting **GPT4o Chat** from the sidebar.
2. **Ask Questions**: Type your question or prompt into the input field.
3. **Attach Files**: Optionally, attach files from your open files to provide additional context for better answers.
4. **Submit**: Click the "Send" button or press Enter to submit your question.

## Known Issues

- **File Attachments**: Large workspaces with many files may cause performance issues when fetching the list of open files.
- **Rate Limits**: Be mindful of OpenAI API rate limits based on your account type. Excessive requests may result in delayed responses.


## Support the Project

If you enjoy using the GPT4free Code Assistant and want to see even more features added in the future, I would truly appreciate your support! Your contributions will help me continue to improve this extension and keep it available for free to everyone.

If you're interested in supporting the project, you can grab me a coffee at [Buy Me A Coffee](https://buymeacoffee.com/sidjames). Every little bit helps and goes a long way in making this tool better for all of you. Thank you for considering it!


## Release Notes

### 1.0.0
- **Initial release of GPT4o Chat.**
  - Basic integration of GPT functionality with VSCode.
  - Enabled chat interaction with the OpenAI API.
  - Fundamental UI setup for the chat interface.

### 1.0.1
- **Improved User Interface.**
  - Enhanced styling for the chat interface.
  - Added responsive design for better usability across different screen sizes.
  
### 1.0.2
- **Performance Enhancements.**
  - Optimized the message handling to reduce lag during chat interactions.
  - Improved loading times for webview content.

### 1.0.3
- **Bug Fixes.**
  - Fixed issues with file attachment functionality.
  - Resolved UI glitches that affected user experience.

### 1.1.0
- **Major Feature Update.**
  - Added support for attaching open files to the chat for context-aware interactions.
  - Implemented automated code refactoring feature, providing code suggestions upon user request.
  - Introduced a searchable chat history for easy access to previous interactions.

### 1.1.1
- **User Experience Improvements.**
  - Added instant prompt copying feature for user queries.
  - Retained user's last input and file selections to improve workflow continuity.
  - Enhanced search functionality within the chat history.

### 1.1.2
- **Configuration Enhancements.**
  - Introduced additional configuration options to select different GPT models for various tasks (e.g., chat, refactoring).
  - Expanded the documentation detailing the extension settings for user clarification.

### 1.1.3
- **Bug Fixes.**
    - Fixed issues with file attachment functionality.
    
### 1.1.4
- **Readme Enhancements.**
    - Naming and description enhancements to better explain the features.
    - Logo updated

### 1.1.5
- **Support**
    - Logo updated.
    - Added but me a coffee to readme and help.

### 1.1.6
- **New "Copy Attached Files" Option**  
  - Added a new option in the action menu (the 3-dot menu) to copy the contents of selected attachments to the clipboard.
  - Ensures quick and convenient access to file content without including the user prompt text.

---

## Extension Guidelines

This extension follows [Visual Studio Code's extension guidelines](https://code.visualstudio.com/api/references/extension-guidelines) to ensure compatibility and performance.

## For more information

For more details about GPT models and AI integration, check out:

- [OpenAI GPT Documentation](https://beta.openai.com/docs/)
- [Visual Studio Code API Reference](https://code.visualstudio.com/api)

**Enjoy enhancing your coding experience with AI!**
