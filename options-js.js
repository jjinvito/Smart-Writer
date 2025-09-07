// Enhanced options.js with improved functionality
// Updated for OpenAI API

document.addEventListener('DOMContentLoaded', function () {
  loadSettings();

  const saveButton = document.getElementById('saveButton');
  const testButton = document.getElementById('testButton');
  const apiKeyInput = document.getElementById('apiKey');
  const defaultToneSelect = document.getElementById('defaultTone');
  const autoGrammarCheck = document.getElementById('autoGrammarCheck');
  const showSuggestions = document.getElementById('showSuggestions');
  const resetButton = document.getElementById('resetButton');

  saveButton.addEventListener('click', saveSettings);
  testButton.addEventListener('click', testAPIConnection);

  if (resetButton) {
    resetButton.addEventListener('click', resetSettings);
  }

  // Save settings when inputs change
  apiKeyInput.addEventListener('input', function () {
    clearTestResult();
    validateAPIKey();
  });

  defaultToneSelect.addEventListener('change', function () {
    showMessage('Settings changed. Click Save to apply.', 'info');
  });

  if (autoGrammarCheck) {
    autoGrammarCheck.addEventListener('change', function () {
      showMessage('Settings changed. Click Save to apply.', 'info');
    });
  }

  if (showSuggestions) {
    showSuggestions.addEventListener('change', function () {
      showMessage('Settings changed. Click Save to apply.', 'info');
    });
  }

  // Add password toggle for API key
  addPasswordToggle();
});

function loadSettings() {
  chrome.storage.sync.get(
    [
      'openaiApiKey',
      'defaultTone',
      'autoGrammarCheck',
      'showSuggestions',
      'enableEmailAnalysis',
      'analysisFrequency',
    ],
    function (data) {
    if (data.openaiApiKey) {
      document.getElementById('apiKey').value = data.openaiApiKey;
    }
    if (data.defaultTone) {
      document.getElementById('defaultTone').value = data.defaultTone;
    }
    if (data.autoGrammarCheck !== undefined) {
      const autoGrammarCheck = document.getElementById('autoGrammarCheck');
      if (autoGrammarCheck) {
        autoGrammarCheck.checked = data.autoGrammarCheck;
        }
      }
    if (data.showSuggestions !== undefined) {
      const showSuggestions = document.getElementById('showSuggestions');
      if (showSuggestions) {
        showSuggestions.checked = data.showSuggestions;
      }
    }
    if (data.enableEmailAnalysis !== undefined) {
      const enableEmailAnalysis = document.getElementById('enableEmailAnalysis');
      if (enableEmailAnalysis) {
          enableEmailAnalysis.checked = data.enableEmailAnalysis;
        }
      }
    if (data.analysisFrequency) {
      const analysisFrequency = document.getElementById('analysisFrequency');
        if (analysisFrequency) {
        analysisFrequency.value = data.analysisFrequency;
      }
      }

    // Validate API key on load
      validateAPIKey();
    },
  );
}

function validateAPIKey() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const validationStatus = document.getElementById('validationStatus');

  if (!validationStatus) return;

  if (!apiKey) {
    validationStatus.textContent = 'API key is required';
    validationStatus.className = 'validation-status validation-error';
    return false;
  }

  if (!apiKey.startsWith('sk-')) {
    validationStatus.textContent = 'Invalid API key format. OpenAI API keys start with "sk-"';
    validationStatus.className = 'validation-status validation-error';
    return false;
  }

  validationStatus.textContent = '✓ Valid OpenAI API key format';
  validationStatus.className = 'validation-status validation-success';
  return true;
}

function addPasswordToggle() {
  const apiKeyInput = document.getElementById('apiKey');
  const container = apiKeyInput.parentElement;

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.className = 'password-toggle';
  toggleButton.innerHTML = `
        <svg class="eye-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    `;

  toggleButton.addEventListener('click', function () {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;

    const eyeIcon = toggleButton.querySelector('.eye-icon');
    if (type === 'text') {
      eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            `;
    } else {
      eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
    }
  });

  container.style.position = 'relative';
  container.appendChild(toggleButton);
}

function saveSettings() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const defaultTone = document.getElementById('defaultTone').value;
  const autoGrammarCheck = document.getElementById('autoGrammarCheck')?.checked || false;
  const showSuggestions = document.getElementById('showSuggestions')?.checked || true;
  const enableEmailAnalysis = document.getElementById('enableEmailAnalysis')?.checked || false;
  const analysisFrequency = document.getElementById('analysisFrequency')?.value || 'manual';
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');

  if (!apiKey) {
    showMessage('Please enter your API key', 'error');
    return;
  }

  if (!validateAPIKey()) {
    showMessage('Please fix the API key format', 'error');
    return;
  }

  // Show loading state
  saveButton.disabled = true;
  saveButton.innerHTML = `
        <div class="spinner"></div>
        Saving...
    `;

  chrome.storage.sync.set(
    {
      openaiApiKey: apiKey,
    defaultTone,
    autoGrammarCheck: autoGrammarCheck,
    showSuggestions,
      enableEmailAnalysis: enableEmailAnalysis,
      analysisFrequency,
  },
  function () {
      // Reset button state
    saveButton.disabled = false;
    saveButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
            </svg>
            Save Settings
        `;

    if (chrome.runtime.lastError) {
      showMessage(`Error saving settings: ${chrome.runtime.lastError.message}`, 'error');
      } else {
      showMessage('Settings saved successfully!', 'success');
    }
    },
  );
}

async function testAPIConnection() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const testButton = document.getElementById('testButton');
  const testResult = document.getElementById('testResult');

  if (!apiKey) {
    showTestResult('Please enter your API key first', 'error');
    return;
  }

  if (!validateAPIKey()) {
    showTestResult('Please fix the API key format', 'error');
    return;
  }

  // Show loading state
  testButton.disabled = true;
  testButton.innerHTML = `
        <div class="spinner"></div>
        Testing...
    `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert writing assistant.' },
          {
            role: 'user',
            content:
              'Hello! Please respond with just "API connection successful" to confirm this is working.',
          },
        ],
        max_tokens: 20,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const message = data.choices[0].message.content.trim();
      showTestResult(`✅ API connection successful!\n\nResponse: "${message}"`, 'success');
    } else {
      const errorData = await response.json();
      let errorMessage = 'API connection failed';

      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your key and try again.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }

      showTestResult(`❌ ${errorMessage}\n\nStatus: ${response.status}`, 'error');
    }
  } catch (error) {
    console.error('API test error:', error);
    showTestResult(
      `❌ Network error: ${error.message}\n\nPlease check your internet connection and try again.`,
      'error'
    );
  } finally {
    // Reset button state
    testButton.disabled = false;
    testButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
            Test API Connection
        `;
  }
}

function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default values?')) {
    chrome.storage.sync.clear(function () {
      if (chrome.runtime.lastError) {
        showMessage(`Error resetting settings: ${chrome.runtime.lastError.message}`, 'error');
      } else {
        showMessage('Settings reset successfully!', 'success');
        loadSettings();
      }
    });
  }
}

function clearTestResult() {
  const testResult = document.getElementById('testResult');
  if (testResult) {
    testResult.style.display = 'none';
  }
}

function showMessage(message, type) {
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-${type}`;
  statusMessage.style.display = 'block';

  // Hide message after 5 seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 5000);
}

function showTestResult(message, type) {
  const testResult = document.getElementById('testResult');
  testResult.textContent = message;
  testResult.className = `test-result test-${type}`;
  testResult.style.display = 'block';
}

// Add enhanced CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    .password-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .password-toggle:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    
    .eye-icon {
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
    }
    
    .validation-status {
        font-size: 12px;
        margin-top: 6px;
        padding: 4px 8px;
        border-radius: 4px;
    }
    
    .validation-success {
        color: #059669;
        background: #ecfdf5;
        border: 1px solid #d1fae5;
    }
    
    .validation-error {
        color: #dc2626;
        background: #fef2f2;
        border: 1px solid #fecaca;
    }
    
    .status-info {
        background: #eff6ff;
        border: 1px solid #dbeafe;
        color: #1d4ed8;
    }
    
    .form-input[type="password"] {
        padding-right: 40px;
    }
    
    .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
    }
    
    .checkbox-item {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .checkbox-item input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #3b82f6;
    }
    
    .checkbox-item label {
        font-size: 14px;
        color: #374151;
        cursor: pointer;
    }
    
    .button-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #d1d5db;
        margin-left: 12px;
    }
    
    .button-secondary:hover {
        background: #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);
