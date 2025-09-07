# Smart Writing Assistant Extension

An advanced browser extension that provides AI-powered writing assistance for Gmail, Outlook, and Google Docs.

## Features

### 🚀 Enhanced Gmail Integration
- **Smart Writing Assistant Detection**: Automatically detects Gmail's native smart writing assistant
- **Apply Fix Enhancement**: When you click "Apply Fix" on Gmail's suggestions, the extension automatically updates with new AI-powered recommendations
- **Real-time Suggestions**: Provides enhanced writing suggestions that appear alongside Gmail's native features
- **Email Analysis & To-Do Lists**: Analyze recent Gmail emails to create prioritized to-do lists with actionable items
- **Email Categorization**: Automatically categorize emails as Sales, Urgent, Meeting, Info, Promo, or Other
- **Priority Assignment**: Assign HIGH, MEDIUM, or LOW priority to actionable emails
- **Deadline Detection**: Identify deadlines and time-sensitive actions from email content

### 📝 Writing Assistance
- **Grammar Checking**: Real-time grammar and spelling correction
- **Style Improvement**: Enhance writing style and clarity
- **Tone Analysis**: Analyze and improve the tone of your writing
- **Email Generation**: Generate professional emails from your thoughts
- **Powered by OpenAI ChatGPT**: All AI features use OpenAI's GPT-3.5/4 models

### 🎯 Multi-Platform Support
- **Gmail**: Full integration with Gmail's compose interface
- **Outlook**: Support for Outlook web interface
- **Google Docs**: Integration with Google Docs editor

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Configure your OpenAI API key in the extension options

## Configuration

1. Click the extension icon in your browser toolbar
2. Go to "Options" to configure your OpenAI API key
3. The extension will now work with Gmail and other supported platforms

## How It Works

### Gmail Smart Writing Assistant Integration

When you're writing an email in Gmail:

1. **Automatic Detection**: The extension automatically detects when Gmail's smart writing assistant appears
2. **Enhanced Apply Fix**: When you click "Apply Fix" on Gmail's suggestions, the extension:
   - Applies the original Gmail fix
   - Waits for the fix to be applied
   - Automatically generates new AI-powered writing suggestions
   - Shows enhanced recommendations in a floating panel
3. **Continuous Improvement**: Each time you apply a fix, new suggestions are generated based on the updated text

### Writing Features

- **Real-time Grammar Checking**: As you type, the extension checks for grammar and style issues
- **Inline Suggestions**: Hover over highlighted text to see improvement suggestions
- **One-click Fixes**: Click on highlighted issues to apply fixes instantly
- **Smart Modal**: Use the extension's modal for advanced writing assistance

## API Key Setup

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Open the extension options
3. Enter your API key (starts with `sk-`)
4. Save the settings

## Usage Examples

### Gmail Integration
1. Open Gmail and start composing an email
2. When Gmail's smart writing assistant appears with suggestions
3. Click "Apply Fix" on any suggestion
4. The extension will automatically generate new AI-powered recommendations
5. Click "Apply Fix" on the enhanced suggestions to apply them

### Email Analysis
1. Click the extension icon and go to the "Activity" tab
2. Click "Analyze Recent Emails" to authenticate with Gmail
3. The extension will analyze your recent emails and create a prioritized to-do list
4. View categorized emails with priority levels and suggested actions
5. Use the to-do list to track important follow-ups and deadlines

### Writing Assistance
1. Click the extension icon while composing
2. Choose from Generate, Improve, Grammar, or Tone tabs
3. Enter your text or thoughts
4. Get AI-powered suggestions and improvements

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, storage, clipboardWrite
- **Host Permissions**: Gmail, Outlook, Google Docs, OpenAI API
- **Content Scripts**: Real-time integration with web interfaces
- **Background Service**: AI API communication and processing
- **AI Model**: OpenAI GPT-3.5-turbo (default), can be upgraded to GPT-4 if you have access

## Troubleshooting

- **API Key Issues**: Make sure your OpenAI API key is correctly configured
- **Gmail Not Working**: Ensure you're on the Gmail web interface (mail.google.com)
- **Suggestions Not Appearing**: Check the browser console for error messages
- **Extension Not Loading**: Verify the manifest.json file is valid

## Development

The extension is built with vanilla JavaScript and uses:
- Chrome Extension Manifest V3
- OpenAI ChatGPT API for AI features
- MutationObserver for dynamic content detection
- Real-time DOM manipulation for seamless integration

## License

This project is open source and available under the MIT License. # Smart-Writer
