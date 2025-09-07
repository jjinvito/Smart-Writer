// Enhanced popup.js with improved functionality and email analysis
let selectedTone = 'professional';
let generatedEmailContent = '';
let isGenerating = false;
let gmailToken = null;

document.addEventListener('DOMContentLoaded', function () {
  initializePopup();
  initializeEmailAnalysis();
});

function initializePopup() {
  const thoughtsTextarea = document.getElementById('thoughts');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const output = document.getElementById('output');
  const optionsLink = document.getElementById('optionsLink');
  const toneButtons = document.querySelectorAll('.tone-button');
  const clearBtn = document.getElementById('clearBtn');
  const improveBtn = document.getElementById('improveBtn');

  // Initialize tab functionality
  initializeTabs();

  // Load saved data
  loadSavedData();

  // Tone selection
  toneButtons.forEach(button => {
    button.addEventListener('click', function () {
      toneButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      selectedTone = this.dataset.tone;
      saveData();
    });
  });

  // Generate email
  generateBtn.addEventListener('click', generateEmail);

  // Copy to clipboard
  copyBtn.addEventListener('click', copyToClipboard);

  // Clear content
  if (clearBtn) {
    clearBtn.addEventListener('click', clearContent);
  }

  // Improve text
  if (improveBtn) {
    improveBtn.addEventListener('click', improveText);
  }

  // Options link
  optionsLink.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Auto-save thoughts
  thoughtsTextarea.addEventListener('input', function () {
    saveData();
    updateCharacterCount();
  });

  // Keyboard shortcuts
  thoughtsTextarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      generateEmail();
    }
  });

  // Initialize character count
  updateCharacterCount();
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function () {
      const targetTab = this.dataset.tab;

      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Show target tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
          content.classList.add('active');
        }
      });
    });
  });
}

async function generateEmail() {
  if (isGenerating) return;

  const thoughts = document.getElementById('thoughts').value.trim();
  const generateBtn = document.getElementById('generateBtn');
  const output = document.getElementById('output');

  if (!thoughts) {
    showError('Please enter your thoughts first');
    return;
  }

  // Check if API key is configured
  try {
    const { apiKey } = await chrome.storage.sync.get(['apiKey']);
    if (!apiKey) {
      showError('Please configure your API key in Settings');
      return;
    }
  } catch (error) {
    showError('Error accessing settings');
    return;
  }

  // Show loading state
  isGenerating = true;
  generateBtn.disabled = true;
  generateBtn.innerHTML = `
        <div class="spinner"></div>
        Generating...
    `;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateEmail',
      thoughts,
      tone: selectedTone,
    });

    if (response.success) {
      generatedEmailContent = response.email;
      output.textContent = generatedEmailContent;
      output.classList.remove('output-empty');
      document.getElementById('copyBtn').style.display = 'flex';

      // Show success message
      showSuccess('Email generated successfully!');

      // Save the generated email
      saveData();
    } else {
      showError(response.error || 'Failed to generate email');
    }
  } catch (error) {
    console.error('Error generating email:', error);
    showError('Error generating email. Please try again.');
  } finally {
    // Reset button state
    isGenerating = false;
    generateBtn.disabled = false;
    generateBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Generate Email
        `;
  }
}

async function improveText() {
  const output = document.getElementById('output');
  const text = output.textContent.trim();

  if (!text || output.classList.contains('output-empty')) {
    showError('No text to improve. Please generate an email first.');
    return;
  }

  const improveBtn = document.getElementById('improveBtn');

  // Show loading state
  improveBtn.disabled = true;
  improveBtn.innerHTML = `
        <div class="spinner"></div>
        Improving...
    `;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'improveText',
      text,
      options: ['grammar', 'style', 'clarity'],
    });

    if (response.success) {
      generatedEmailContent = response.improvedText;
      output.textContent = generatedEmailContent;
      showSuccess('Text improved successfully!');
      saveData();
    } else {
      showError(response.error || 'Failed to improve text');
    }
  } catch (error) {
    console.error('Error improving text:', error);
    showError('Error improving text. Please try again.');
  } finally {
    improveBtn.disabled = false;
    improveBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Improve
        `;
  }
}

async function copyToClipboard() {
  const copyBtn = document.getElementById('copyBtn');

  try {
    await navigator.clipboard.writeText(generatedEmailContent);

    // Show success state
    copyBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
            Copied!
        `;
    copyBtn.classList.add('copied');

    showSuccess('Copied to clipboard!');

    // Reset after 2 seconds
    setTimeout(() => {
      copyBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
            `;
      copyBtn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    showError('Failed to copy to clipboard');
  }
}

function clearContent() {
  const thoughtsTextarea = document.getElementById('thoughts');
  const output = document.getElementById('output');
  const copyBtn = document.getElementById('copyBtn');

  thoughtsTextarea.value = '';
  output.textContent = '';
  output.classList.add('output-empty');
  copyBtn.style.display = 'none';

  generatedEmailContent = '';
  saveData();
  updateCharacterCount();

  showSuccess('Content cleared');
}

function updateCharacterCount() {
  const thoughtsTextarea = document.getElementById('thoughts');
  const charCount = document.getElementById('charCount');

  if (charCount) {
    const count = thoughtsTextarea.value.length;
    charCount.textContent = `${count} characters`;

    // Change color based on length
    if (count > 500) {
      charCount.style.color = '#dc2626';
    } else if (count > 300) {
      charCount.style.color = '#ea580c';
    } else {
      charCount.style.color = '#6b7280';
    }
  }
}

function showError(message) {
  const output = document.getElementById('output');
  output.innerHTML = `<div class="error-message">${message}</div>`;
  output.classList.add('output-empty');
  document.getElementById('copyBtn').style.display = 'none';

  // Auto-hide error after 5 seconds
  setTimeout(() => {
    if (output.querySelector('.error-message')) {
      output.innerHTML = '';
      output.classList.add('output-empty');
    }
  }, 5000);
}

function showSuccess(message) {
  // Create temporary success message
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;

  document.body.appendChild(successDiv);

  // Remove after 3 seconds
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.remove();
    }
  }, 3000);
}

function saveData() {
  const data = {
    thoughts: document.getElementById('thoughts').value,
    tone: selectedTone,
    generatedEmail: generatedEmailContent,
  };

  chrome.storage.local.set(data);
}

function loadSavedData() {
  chrome.storage.local.get(['thoughts', 'tone', 'generatedEmail'], function (data) {
    if (data.thoughts) {
      document.getElementById('thoughts').value = data.thoughts;
    }

    if (data.tone) {
      selectedTone = data.tone;
      document.querySelectorAll('.tone-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tone === selectedTone) {
          btn.classList.add('active');
        }
      });
    }

    if (data.generatedEmail) {
      generatedEmailContent = data.generatedEmail;
      const output = document.getElementById('output');
      output.textContent = generatedEmailContent;
      output.classList.remove('output-empty');
      document.getElementById('copyBtn').style.display = 'flex';
    }
  });
}

// Add CSS for success messages
const style = document.createElement('style');
style.textContent = `
    .success-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ecfdf5;
        color: #059669;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #d1fae5;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-message {
        color: #dc2626;
        background: #fef2f2;
        border: 1px solid #fecaca;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        text-align: center;
    }
    
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .tone-button.active {
        background: #eff6ff;
        border-color: #3b82f6;
        color: #3b82f6;
    }
    
    .copy-button.copied {
        background: #dcfce7;
        border-color: #16a34a;
        color: #16a34a;
    }
`;
document.head.appendChild(style);

// Email Analysis functionality
let currentView = 'actionable'; // Track current view: 'actionable' or 'all'
let cachedAllEmails = []; // Store all emails for viewing

function initializeEmailAnalysis() {
    const analyzeBtn = document.getElementById('analyzeEmailsBtn');
    const testBtn = document.getElementById('testGmailBtn');
    const refreshBtn = document.getElementById('refreshAnalysisBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const totalEmailsStat = document.getElementById('totalEmailsStat');
    const actionableEmailsStat = document.getElementById('actionableEmailsStat');
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            await analyzeRecentEmails();
        });
    }
    
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            await testGmailConnection();
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await refreshAnalysis();
        });
    }
    
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', async () => {
            await clearCache();
        });
    }
    
    // Add click handlers for stats
    if (totalEmailsStat) {
        console.log('Setting up click handler for total emails stat');
        totalEmailsStat.addEventListener('click', () => {
            console.log('Total emails stat clicked');
            switchView('all');
        });
    }
    
    if (actionableEmailsStat) {
        console.log('Setting up click handler for actionable emails stat');
        actionableEmailsStat.addEventListener('click', () => {
            console.log('Actionable emails stat clicked');
            switchView('actionable');
        });
    }
    
    // Check cache status on initialization
    checkCacheStatus();
}

async function analyzeRecentEmails() {
  const statusDiv = document.getElementById('emailAnalysisStatus');
  const analyzeBtn = document.getElementById('analyzeEmailsBtn');

  try {
    // Show loading state
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '🔄 Authenticating with Gmail...';
    analyzeBtn.disabled = true;

    // Authenticate with Gmail if needed
    if (!gmailToken) {
      const authResult = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'authenticateGmail' }, resolve);
      });

      if (!authResult.success) {
        throw new Error(`Gmail authentication failed: ${authResult.error}`);
      }

      gmailToken = authResult.token;
    }

    // Analyze emails
    statusDiv.innerHTML = '🔍 Analyzing recent emails...';

    const analysisResult = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        {
          action: 'analyzeEmails',
          token: gmailToken,
        },
        resolve
      );
    });

    if (!analysisResult.success) {
      throw new Error(`Email analysis failed: ${analysisResult.error}`);
    }

            // Store all emails for viewing
        if (analysisResult.allEmails) {
            cachedAllEmails = analysisResult.allEmails;
            console.log('Stored all emails in cache:', cachedAllEmails.length);
        }
        
        // Display results
        displayEmailAnalysis(analysisResult.analysis, analysisResult.emailCount, analysisResult.cached);
        
        if (analysisResult.cached) {
            statusDiv.innerHTML = `✅ Using cached analysis (${analysisResult.cacheAge} minutes old)`;
            statusDiv.style.color = '#059669';
        } else {
            statusDiv.style.display = 'none';
        }
  } catch (error) {
    console.error('Email analysis error:', error);
    statusDiv.innerHTML = `❌ Error: ${error.message}`;
    statusDiv.style.color = '#ef4444';
  } finally {
    analyzeBtn.disabled = false;
  }
}

function displayEmailAnalysis(analysis, totalEmails, cached = false) {
  const summaryDiv = document.getElementById('emailSummary');
  const todoListDiv = document.getElementById('todoList');

  console.log('Displaying email analysis:', { totalEmails, actionableCount: analysis.todos.length, cached });

  // Update summary stats
  document.getElementById('totalEmails').textContent = totalEmails;
  document.getElementById('actionableEmails').textContent = analysis.todos.length;
  summaryDiv.style.display = 'block';

  // Display todo items
  todoListDiv.innerHTML = '';

  if (analysis.todos.length === 0) {
    todoListDiv.innerHTML = '<div class="no-todos">✅ No urgent emails requiring action!</div>';
    return;
  }

  analysis.todos.forEach((todo, index) => {
    const todoItem = createTodoElement(todo, index);
    todoListDiv.appendChild(todoItem);
  });

  // Update cache status if this was a fresh analysis
  if (!cached) {
    checkCacheStatus();
  }
}

function createTodoElement(todo, index) {
  const todoDiv = document.createElement('div');
  todoDiv.className = `todo-item priority-${todo.priority.toLowerCase()}`;

  const categoryColor = {
    SALES: '#10b981',
    URGENT: '#ef4444',
    MEETING: '#8b5cf6',
    INFO: '#3b82f6',
    PROMO: '#f59e0b',
    OTHER: '#6b7280',
  };

  todoDiv.innerHTML = `
        <div class="todo-header">
            <span class="todo-category" style="background-color: ${categoryColor[todo.category] || '#6b7280'}">
                ${todo.category}
            </span>
            <span class="todo-priority priority-${todo.priority.toLowerCase()}">
                ${todo.priority}
            </span>
        </div>
        <div class="todo-content">
            <h4 class="todo-subject">${todo.subject}</h4>
            <p class="todo-from">From: ${todo.from}</p>
            <p class="todo-action">${todo.action}</p>
            ${todo.deadline ? `<p class="todo-deadline">⏰ ${todo.deadline}</p>` : ''}
        </div>
    `;

      return todoDiv;
}

function switchView(view) {
    console.log('Switching view to:', view);
    currentView = view;
    
    // Update active state of stat buttons
    const totalEmailsStat = document.getElementById('totalEmailsStat');
    const actionableEmailsStat = document.getElementById('actionableEmailsStat');
    
    if (totalEmailsStat && actionableEmailsStat) {
        totalEmailsStat.classList.toggle('active', view === 'all');
        actionableEmailsStat.classList.toggle('active', view === 'actionable');
    }
    
    // Display appropriate content
    if (view === 'all') {
        displayAllEmails();
    } else {
        displayActionableEmails();
    }
}

function displayAllEmails() {
    const todoListDiv = document.getElementById('todoList');
    
    console.log('Displaying all emails. Count:', cachedAllEmails.length);
    
    if (cachedAllEmails.length === 0) {
        todoListDiv.innerHTML = '<div class="no-todos">No emails found for today</div>';
        return;
    }
    
    todoListDiv.innerHTML = '';
    
    cachedAllEmails.forEach((email, index) => {
        const emailItem = createEmailElement(email, index);
        todoListDiv.appendChild(emailItem);
    });
}

function displayActionableEmails() {
    // This will be called when switching back to actionable view
    // We need to reload the cached analysis to show actionable items
    console.log('Switching to actionable emails view');
    chrome.runtime.sendMessage({ action: 'loadCachedAnalysis' }, result => {
        if (result.success) {
            console.log('Loaded cached analysis for actionable view');
            displayEmailAnalysis(result.analysis, result.emailCount, true);
        } else {
            console.log('Failed to load cached analysis:', result.error);
        }
    });
}

function createEmailElement(email, index) {
    const emailDiv = document.createElement('div');
    emailDiv.className = 'todo-item';
    
    const date = new Date(email.date).toLocaleDateString();
    const time = new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    emailDiv.innerHTML = `
        <div class="todo-header">
            <span class="todo-category" style="background-color: #6b7280">
                EMAIL
            </span>
            <span class="todo-priority priority-low">
                ${time}
            </span>
        </div>
        <div class="todo-content">
            <h4 class="todo-subject">${email.subject}</h4>
            <p class="todo-from">From: ${email.from}</p>
            <p class="todo-action">${email.snippet || 'No preview available'}</p>
            <p class="todo-deadline">📅 ${date}</p>
        </div>
    `;
    
    return emailDiv;
}

async function checkCacheStatus() {
  try {
    const cacheStatus = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getEmailCacheStatus' }, resolve);
    });

    const cacheStatusDiv = document.getElementById('cacheStatus');
    const cacheAgeSpan = document.getElementById('cacheAge');

    if (cacheStatus.success && cacheStatus.hasCache) {
      cacheStatusDiv.style.display = 'flex';
      cacheAgeSpan.textContent = `${cacheStatus.remainingMinutes}`;

      // Load cached analysis data
      const cachedAnalysis = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'loadCachedAnalysis' }, resolve);
      });

          if (cachedAnalysis.success) {
        cachedAllEmails = cachedAnalysis.allEmails || [];
        console.log('Loaded cached all emails:', cachedAllEmails.length);
        displayEmailAnalysis(cachedAnalysis.analysis, cachedAnalysis.emailCount, true);
    }
    } else {
      cacheStatusDiv.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking cache status:', error);
  }
}

async function refreshAnalysis() {
  // Clear cache and re-analyze
  await clearCache();
  await analyzeRecentEmails();
}

async function clearCache() {
  try {
    const result = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'clearEmailCache' }, resolve);
    });

    if (result.success) {
      // Hide cache status
      document.getElementById('cacheStatus').style.display = 'none';

      // Clear displayed data
      document.getElementById('emailSummary').style.display = 'none';
      document.getElementById('todoList').innerHTML = '';

      // Show success message
      const statusDiv = document.getElementById('emailAnalysisStatus');
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = '✅ Cache cleared successfully';
      statusDiv.style.color = '#059669';

      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

async function testGmailConnection() {
  const statusDiv = document.getElementById('emailAnalysisStatus');
  const testBtn = document.getElementById('testGmailBtn');

  try {
    // Show loading state
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '🔄 Testing Gmail connection...';
    testBtn.disabled = true;

    const testResult = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'testGmailConnection' }, resolve);
    });

    if (testResult.success) {
      statusDiv.innerHTML = `✅ ${testResult.message}`;
      statusDiv.style.color = '#059669';
    } else {
      statusDiv.innerHTML = `❌ Connection failed: ${testResult.error}`;
      statusDiv.style.color = '#ef4444';
    }
  } catch (error) {
    console.error('Gmail connection test error:', error);
    statusDiv.innerHTML = `❌ Error: ${error.message}`;
    statusDiv.style.color = '#ef4444';
  } finally {
    testBtn.disabled = false;
  }
}
