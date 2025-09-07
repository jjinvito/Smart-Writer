// Enhanced content script with real-time grammar checking and writing suggestions
(function () {
  'use strict';

  let isInjected = false;
  let currentComposeElement = null;
  let grammarCheckInterval = null;
  let suggestionsPanel = null;
  const realTimeChecker = null;
  let suggestionBubbles = [];
  let lastCheckedText = '';
  let gmailAssistantObserver = null;

  // Initialize the content script
  function init() {
    if (isInjected) return;
    isInjected = true;

    // Add integration button to email compose areas
    addIntegrationButtons();

    // Watch for dynamically loaded compose windows
    observeCompose();

    // Initialize real-time grammar checking
    initGrammarChecking();

    // Initialize real-time writing assistant
    initRealTimeAssistant();

    // Initialize Gmail smart writing assistant integration
    initGmailSmartAssistant();
  }

  function addIntegrationButtons() {
    // Gmail integration
    if (window.location.hostname === 'mail.google.com') {
      addGmailIntegration();
    }

    // Outlook integration
    if (window.location.hostname.includes('outlook')) {
      addOutlookIntegration();
    }

    // Google Docs integration
    if (window.location.hostname === 'docs.google.com') {
      addGoogleDocsIntegration();
    }
  }

  function addGmailIntegration() {
    const checkGmail = setInterval(() => {
      const composeElements = document.querySelectorAll('[role="textbox"][aria-label*="Message Body"]');

      composeElements.forEach(element => {
        if (!element.dataset.smartAssistantAdded) {
          element.dataset.smartAssistantAdded = 'true';
          addSmartAssistantButton(element, 'gmail');
          setupRealTimeChecking(element);
        }
      });

      setTimeout(() => clearInterval(checkGmail), 30000);
    }, 1000);
  }

  function addOutlookIntegration() {
    const checkOutlook = setInterval(() => {
      const composeElements = document.querySelectorAll('[role="textbox"][aria-label*="Message body"]');

      composeElements.forEach(element => {
        if (!element.dataset.smartAssistantAdded) {
          element.dataset.smartAssistantAdded = 'true';
          addSmartAssistantButton(element, 'outlook');
          setupRealTimeChecking(element);
        }
      });

      setTimeout(() => clearInterval(checkOutlook), 30000);
    }, 1000);
  }

  function addGoogleDocsIntegration() {
    const checkDocs = setInterval(() => {
      const docElements = document.querySelectorAll('.kix-appview-editor');

      docElements.forEach(element => {
        if (!element.dataset.smartAssistantAdded) {
          element.dataset.smartAssistantAdded = 'true';
          addSmartAssistantButton(element, 'docs');
          setupRealTimeChecking(element);
        }
      });

      setTimeout(() => clearInterval(checkDocs), 30000);
    }, 1000);
  }

  // Improved Smart Assistant button: only in toolbar, styled
  function addSmartAssistantButton(composeElement, platform) {
    const button = document.createElement('button');
    button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
        `;
    button.className = 'smart-assistant-button';
    button.title = 'Open Smart Writing Assistant';
    button.type = 'button';
    button.style.cssText = `
            background: transparent;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: #5f6368;
            margin: 0 4px;
            transition: background-color 0.2s;
        `;
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#f1f3f4';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSmartAssistantModal(composeElement, platform);
    });
    const toolbar = findToolbar(composeElement, platform);
    if (toolbar && !toolbar.closest('[role="textbox"]') && !toolbar.closest('[contenteditable="true"]')) {
      toolbar.appendChild(button);
    }
  }

  function setupRealTimeChecking(element) {
    // Add real-time checking to the element
    element.addEventListener('input', debounce(() => {
        if (element.textContent.trim() && element.textContent !== lastCheckedText) {
        lastCheckedText = element.textContent;
          checkRealTimeGrammar(element);
      }
    }, 1000));


    // Also check on focus
    element.addEventListener('focus', () => {
      if (element.textContent.trim()) {
        checkRealTimeGrammar(element);
      }
    });
  }

  function initRealTimeAssistant() {
    // Create floating suggestion panel
    createSuggestionPanel();

    // Add styles for real-time suggestions
    addRealTimeStyles();
  }

  function createSuggestionPanel() {
    suggestionsPanel = document.createElement('div');
    suggestionsPanel.className = 'smart-assistant-suggestions';
    suggestionsPanel.innerHTML = `
            <div class="suggestions-header">
                <span>Smart Writing Assistant</span>
                <button class="close-suggestions">×</button>
            </div>
            <div class="suggestions-content"></div>
        `;

    // Add close button functionality
    suggestionsPanel.querySelector('.close-suggestions').addEventListener('click', () => {
      suggestionsPanel.style.display = 'none';
    });

    document.body.appendChild(suggestionsPanel);
  }

  function addRealTimeStyles() {
    const style = document.createElement('style');
    style.textContent = `
            /* Ensure extension elements don't appear in email content */
            .smart-assistant-button,
            .smart-assistant-suggestions,
            .enhanced-smart-assistant {
                -webkit-user-select: none;
                -moz-user-select: none;
                user-select: none;
                pointer-events: auto;
            }
            
            /* Hide extension elements when printing or in email preview */
            @media print {
                .smart-assistant-button,
                .smart-assistant-suggestions,
                .enhanced-smart-assistant {
                    display: none !important;
                }
            }
            
            .smart-assistant-suggestions {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                max-height: 400px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                display: none;
                overflow: hidden;
            }
            
            .suggestions-header {
                background: linear-gradient(135deg, #3b82f6, #6366f1);
                color: white;
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                font-weight: 600;
            }
            
            .close-suggestions {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .suggestions-content {
                padding: 16px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .suggestion-item {
                padding: 12px;
                margin-bottom: 8px;
                background: #f8fafc;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
                font-size: 13px;
            }
            
            .suggestion-type {
                font-size: 11px;
                font-weight: 600;
                color: #3b82f6;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            
            .suggestion-text {
                color: #374151;
                margin-bottom: 6px;
                font-style: italic;
            }
            
            .suggestion-fix {
                color: #059669;
                font-weight: 500;
                margin-bottom: 8px;
            }
            
            .apply-fix-btn {
                padding: 4px 8px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .apply-fix-btn:hover {
                background: #2563eb;
            }
            
            .grammar-highlight {
                background: #fef3c7;
                border-bottom: 2px solid #f59e0b;
                cursor: pointer;
                position: relative;
            }
            
            .grammar-highlight:hover {
                background: #fde68a;
            }
            
            .inline-suggestion {
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 10001;
                max-width: 250px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .inline-suggestion::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 10px;
                border: 5px solid transparent;
                border-top-color: #1f2937;
            }
        `;
    document.head.appendChild(style);
  }

  // Heuristic signature splitter
  function splitBodyAndSignature(text) {
    if (!text) return { body: '', signature: '' };
    const lines = text.split(/\r?\n/);
    let sigStart = lines.length;
    // 1. Standard delimiter
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '--' || lines[i].trim() === '-- ') {
        sigStart = i;
        break;
      }
    }
    // 2. Pattern recognition (bottom-up)
    const signaturePatterns = [
      /\b(phone|mobile|cell|tel|email|e-mail|fax|www|http|linkedin|twitter|facebook|skype|contact|address|web)\b/i,
      /\bceo|cto|founder|manager|director|engineer|developer|analyst|consultant|president|officer|chief|lead|intern\b/i,
      /\binc\.|llc\.|ltd\.|corp\.|company|corporation|group|plc\b/i,
      /\bdisclaimer|confidential|privileged|intended recipient|please consider the environment\b/i,
      /@/,
      /https?:\/\//
    ];
    let shortLineCount = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      // If already found delimiter, skip
      if (i >= sigStart) continue;
      // Heuristic: short lines with patterns
      if (line.length <= 60) {
        for (const pat of signaturePatterns) {
          if (pat.test(line)) {
            sigStart = i;
            break;
          }
        }
      }
      // Heuristic: 3+ consecutive short lines at the end
      if (line.length <= 40) {
        shortLineCount++;
        if (shortLineCount >= 3) {
          sigStart = i;
          break;
        }
      } else {
        shortLineCount = 0;
      }
    }
    // 3. Rule-based: sudden transition to longer line
    // (already handled by above, but could be refined)
    const body = lines.slice(0, sigStart).join('\n').trim();
    const signature = lines.slice(sigStart).join('\n').trim();
    return { body, signature };
  }

  // Use the splitter for grammar check
  async function checkRealTimeGrammar(element, retryCount = 0) {
    try {
      const text = element.textContent.trim();
      const { body } = splitBodyAndSignature(text);
      console.log('[Smart Assistant] Text sent for grammar check:', body);
      if (!body || body.length < 10) return; // Only check if there's substantial text
      const response = await chrome.runtime.sendMessage({
        action: 'checkGrammar',
        text: body,
            });
      if (response.success && response.suggestions.length > 0) {
        showRealTimeSuggestions(response.suggestions, element);
        highlightGrammarIssues(element, response.suggestions);
      } else {
        hideSuggestions();
      }
    } catch (error) {
      if (error && error.message && error.message.includes('Extension context invalidated') && retryCount < 1) {
        console.warn('[Smart Assistant] Extension context invalidated, retrying grammar check...');
        setTimeout(() => checkRealTimeGrammar(element, retryCount + 1), 500);
      } else {
        console.error('Real-time grammar check error:', error);
      }
    }
  }

  function showRealTimeSuggestions(suggestions, element) {
    if (!suggestionsPanel) return;

    const content = suggestionsPanel.querySelector('.suggestions-content');
    content.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-type">${suggestion.type}</div>
                <div class="suggestion-text">"${suggestion.text}"</div>
                <div class="suggestion-fix">→ "${suggestion.fix}"</div>
                <button class="apply-fix-btn" data-original="${suggestion.text}" data-fix="${suggestion.fix}">Apply Fix</button>
            </div>
        `

    // Add event listeners to apply fix buttons
    content.querySelectorAll('.apply-fix-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyGrammarFix(btn.dataset.original, btn.dataset.fix, element);
      });
    });

    suggestionsPanel.style.display = 'block';
  }

  function hideSuggestions() {
    if (suggestionsPanel) {
      suggestionsPanel.style.display = 'none';
    }
  }

  function highlightGrammarIssues(element, suggestions) {
    // Remove existing highlights
    element.querySelectorAll('.grammar-highlight').forEach(h => {
      const parent = h.parentNode;
      parent.replaceChild(document.createTextNode(h.textContent), h);
      parent.normalize();
    });

    // Add new highlights
    suggestions.forEach(suggestion => {
      const text = element.textContent;
      const index = text.indexOf(suggestion.text);
      if (index !== -1) {
        const range = document.createRange();
        const textNode = element.firstChild || element;

        if (textNode.nodeType === Node.TEXT_NODE) {
          range.setStart(textNode, index);
          range.setEnd(textNode, index + suggestion.text.length);

          const span = document.createElement('span');
          span.className = 'grammar-highlight';
          span.title = `Suggestion: "${suggestion.fix}"`;

          // Add click handler to apply fix
          span.addEventListener('click', () => {
            applyGrammarFix(suggestion.text, suggestion.fix, element);
          });

          // Add hover tooltip
          span.addEventListener('mouseenter', (e) => {
            showInlineSuggestion(e, suggestion.fix);
          });

          span.addEventListener('mouseleave', hideInlineSuggestion);

          range.surroundContents(span);
        }
      }
    });
  }

  function showInlineSuggestion(event, fix) {
    const tooltip = document.createElement('div');
    tooltip.className = 'inline-suggestion';
    tooltip.textContent = `Suggestion: ${fix}`;
    tooltip.style.left = `${event.pageX + 10  }px`;
    tooltip.style.top = `${event.pageY - 30  }px`;

    document.body.appendChild(tooltip);

    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 3000);
  }

  function hideInlineSuggestion() {
    document.querySelectorAll('.inline-suggestion').forEach(t => t.remove());
  }

  function replaceFirstOccurrenceInContentEditable(element, target, replacement) {
    // Walk text nodes and replace the first occurrence
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let found = false;
    let debugCount = 0;
    while (walker.nextNode() && !found) {
      const node = walker.currentNode;
      debugCount++;
      const idx = node.nodeValue.indexOf(target);
      if (idx !== -1) {
        const before = node.nodeValue.slice(0, idx);
        const after = node.nodeValue.slice(idx + target.length);
        const newNode = document.createTextNode(before + replacement + after);
        node.parentNode.replaceChild(newNode, node);
        found = true;
        console.log('[Smart Assistant] Replaced in text node:', node, 'with', newNode);
      }
    }
    if (!found) {
      console.log('[Smart Assistant] Target not found in individual text nodes after', debugCount, 'nodes. Will try fallback.');
    }
    return found;
  }

  function replaceAcrossAllTextNodes(element, target, replacement) {
    // Concatenate all text nodes, replace, and reconstruct
    const textNodes = [];
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    let fullText = textNodes.map(n => n.nodeValue).join('');
    const idx = fullText.indexOf(target);
    if (idx === -1) return false;
    const before = fullText.slice(0, idx);
    const after = fullText.slice(idx + target.length);
    const newFullText = before + replacement + after;
    // Remove all text nodes
    textNodes.forEach(n => n.parentNode.removeChild(n));
    // Insert new text node
    element.insertBefore(document.createTextNode(newFullText), element.firstChild);
    console.log('[Smart Assistant] Fallback: replaced across all text nodes.');
    return true;
  }

  // Only apply fixes to the body (not signature)
  function applyGrammarFix(original, fix, element) {
    console.log('[Smart Assistant] Attempting to apply fix:', { original, fix, element });
    let replaced = false;
    if (element.isContentEditable || element.contentEditable === 'true') {
      // Split into body and signature
      const text = element.textContent;
      const { body, signature } = splitBodyAndSignature(text);
      // Replace only in body
      const newBody = body.replace(original, fix);
      if (newBody !== body) replaced = true;
      // Reconstruct
      let newText = newBody;
      if (signature) newText += `\n${  signature}`;
      // Replace all text nodes with newText
      element.textContent = newText;
      if (!replaced) {
        // Fallback: try node walker as before
        replaced = replaceFirstOccurrenceInContentEditable(element, original, fix);
      }
      if (!replaced) {
        replaced = replaceAcrossAllTextNodes(element, original, fix);
      }
      if (!replaced) {
        element.textContent = element.textContent.replace(original, fix);
        console.log('[Smart Assistant] Fallback: replaced in textContent.');
      }
    } else if (element.value !== undefined) {
      element.value = element.value.replace(original, fix);
      replaced = true;
    } else {
      element.textContent = element.textContent.replace(original, fix);
      replaced = true;
    }
    // Trigger change event
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
    // Hide suggestions after applying fix
    hideSuggestions();
    // Re-check grammar after fix
    setTimeout(() => {
      checkRealTimeGrammar(element);
    }, 500);
    if (replaced) {
      console.log('[Smart Assistant] Fix applied successfully.');
    } else {
      console.log('[Smart Assistant] Fix may not have been applied.');
    }
  }

  function findToolbar(composeElement, platform) {
    if (platform === 'gmail') {
      const composeWindow = composeElement.closest('[role="dialog"]') || composeElement.closest('.nH');
      if (composeWindow) {
        const formatToolbar = composeWindow.querySelector('[role="toolbar"]');
        if (formatToolbar) return formatToolbar;
        const sendArea = composeWindow.querySelector('[data-tooltip="Send"]')?.parentElement;
        if (sendArea) return sendArea;
        const anyToolbar = composeWindow.querySelector('.Am.Al.editable') || composeWindow.querySelector('.aoI');
        if (anyToolbar) return anyToolbar;
      }
      return null;
    } else if (platform === 'outlook') {
      const parent = composeElement.closest('[data-app-section="ComposeBody"]') || composeElement.parentElement;
      return parent.querySelector('[role="toolbar"]') || parent.querySelector('.ms-CommandBar');
    } else if (platform === 'docs') {
      return document.querySelector('.docs-ml-toolbar') || document.querySelector('.docs-ml-buttons');
    }
    return null;
  }

  function openSmartAssistantModal(composeElement, platform) {
    currentComposeElement = composeElement;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'smart-assistant-overlay';
    overlay.innerHTML = `
        <div class="smart-assistant-modal">
            <div class="modal-header">
                <h2>Smart Writing Assistant</h2>
                <button class="close-btn">×</button>
            </div>
            <div class="modal-content">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="generate">Generate Email</button>
                    <button class="tab-btn" data-tab="improve">Improve Text</button>
                    <button class="tab-btn" data-tab="grammar">Grammar Check</button>
                    <button class="tab-btn" data-tab="tone">Tone Analysis</button>
                    <button class="tab-btn" data-tab="daily">Daily Analysis</button>
                </div>
                
                <div class="tab-content active" data-tab="generate">
                    <div class="input-group">
                        <label>What would you like to write about?</label>
                        <textarea class="thoughts-input" placeholder="Describe your thoughts, key points, or the message you want to convey..."></textarea>
                    </div>
                    <div class="input-group">
                        <label>Tone:</label>
                        <select class="tone-select">
                            <option value="professional">Professional</option>
                            <option value="friendly">Friendly</option>
                            <option value="formal">Formal</option>
                            <option value="casual">Casual</option>
                            <option value="persuasive">Persuasive</option>
                        </select>
                    </div>
                    <button class="generate-btn">Generate Email</button>
                </div>
                
                <div class="tab-content" data-tab="improve">
                    <div class="input-group">
                        <label>Text to improve:</label>
                        <textarea class="improve-input" placeholder="Paste the text you want to improve..."></textarea>
                    </div>
                    <div class="improve-options">
                        <label><input type="checkbox" class="improve-option" value="grammar"> Fix grammar</label>
                        <label><input type="checkbox" class="improve-option" value="clarity"> Improve clarity</label>
                        <label><input type="checkbox" class="improve-option" value="tone"> Adjust tone</label>
                        <label><input type="checkbox" class="improve-option" value="conciseness"> Make more concise</label>
                    </div>
                    <button class="improve-btn">Improve Text</button>
                </div>
                
                <div class="tab-content" data-tab="grammar">
                    <div class="grammar-suggestions">
                        <div class="loading">Analyzing grammar...</div>
                    </div>
                </div>
                
                <div class="tab-content" data-tab="tone">
                    <div class="tone-analysis">
                        <div class="tone-result">
                            <label>Primary Tone:</label>
                            <span class="tone-value">Analyzing...</span>
                        </div>
                        <div class="tone-suggestions"></div>
                    </div>
                </div>
                
                <div class="tab-content" data-tab="daily">
                    <div class="daily-analysis">
                        <div class="daily-header">
                            <h3>Today's Email Analysis</h3>
                            <button class="refresh-daily-btn">Refresh</button>
                        </div>
                        <div class="daily-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total Emails:</span>
                                <span class="stat-value" id="total-emails">Loading...</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Average Length:</span>
                                <span class="stat-value" id="avg-length">Loading...</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Common Topics:</span>
                                <span class="stat-value" id="common-topics">Loading...</span>
                            </div>
                        </div>
                        <div class="daily-insights">
                            <h4>Key Insights</h4>
                            <div class="insights-content" id="daily-insights">Loading insights...</div>
                        </div>
                        <div class="daily-actions">
                            <button class="action-btn" id="generate-summary-btn">Generate Summary</button>
                            <button class="action-btn" id="find-patterns-btn">Find Patterns</button>
                            <button class="action-btn" id="suggest-improvements-btn">Suggest Improvements</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    setupModalEventListeners(overlay, composeElement);
    
    document.body.appendChild(overlay);
    
    // Focus on thoughts input
    overlay.querySelector('.thoughts-input').focus();
    
    // Initialize grammar checking for current text
    if (composeElement.textContent.trim()) {
        checkGrammar(composeElement.textContent);
    }
}

function setupModalEventListeners(overlay, composeElement) {
    const closeBtn = overlay.querySelector('.close-btn');
    const cancelBtn = overlay.querySelector('.cancel-btn');
    const generateBtn = overlay.querySelector('.generate-btn');
    const improveBtn = overlay.querySelector('.improve-btn');
    const tabButtons = overlay.querySelectorAll('.tab-btn');
    const refreshDailyBtn = overlay.querySelector('.refresh-daily-btn');
    const generateSummaryBtn = overlay.querySelector('#generate-summary-btn');
    const findPatternsBtn = overlay.querySelector('#find-patterns-btn');
    const suggestImprovementsBtn = overlay.querySelector('#suggest-improvements-btn');
    
    closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
    cancelBtn.addEventListener('click', () => document.body.removeChild(overlay));
    generateBtn.addEventListener('click', () => generateEmailFromModal(overlay, composeElement));
    improveBtn.addEventListener('click', () => improveTextFromModal(overlay, composeElement));
    
    // Daily analysis buttons
    refreshDailyBtn.addEventListener('click', () => analyzeDailyEmails(overlay));
    generateSummaryBtn.addEventListener('click', () => generateDailySummary(overlay));
    findPatternsBtn.addEventListener('click', () => findDailyPatterns(overlay));
    suggestImprovementsBtn.addEventListener('click', () => suggestDailyImprovements(overlay));
    
    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabContents = overlay.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            const targetTab = overlay.querySelector(`[data-tab="${btn.dataset.tab}"]`);
            if (targetTab) targetTab.classList.add('active');
            
            // Initialize tab-specific functionality
            if (btn.dataset.tab === 'grammar') {
                checkGrammar(composeElement.textContent);
            } else if (btn.dataset.tab === 'tone') {
                analyzeTone(composeElement.textContent);
            } else if (btn.dataset.tab === 'daily') {
                analyzeDailyEmails(overlay);
            }
        });
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

async function generateEmailFromModal(overlay, composeElement) {
    const thoughts = overlay.querySelector('.thoughts-input').value.trim();
    const tone = overlay.querySelector('.tone-select').value;
    const generateBtn = overlay.querySelector('.generate-btn');

    if (!thoughts) {
      showModalError(overlay, 'Please enter your thoughts first');
      return;
    }

    // Show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="spinner"></div> Generating...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateEmail',
        thoughts: thoughts,
        tone: tone,
            });

      if (response.success) {
        insertEmailIntoCompose(composeElement, response.email);
        document.body.removeChild(overlay);
      } else {
        showModalError(overlay, response.error || 'Failed to generate email');
      }
    } catch (error) {
      console.error('Error:', error);
      showModalError(overlay, 'Error generating email. Please try again.');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = 'Generate Email';
    }
}

async function improveTextFromModal(overlay, composeElement) {
    const text = overlay.querySelector('.improve-input').value.trim();
    const options = Array.from(overlay.querySelectorAll('.improve-option:checked')).map(opt => opt.value);
    const improveBtn = overlay.querySelector('.improve-btn');

    if (!text) {
      showModalError(overlay, 'Please enter text to improve');
      return;
    }

    if (options.length === 0) {
      showModalError(overlay, 'Please select at least one improvement option');
      return;
    }

    // Show loading state
    improveBtn.disabled = true;
    improveBtn.innerHTML = '<div class="spinner"></div> Improving...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'improveText',
        text,
        options: options,
            });

      if (response.success) {
        overlay.querySelector('.improve-input').value = response.improvedText;
        showModalSuccess(overlay, 'Text improved successfully!');
      } else {
        showModalError(overlay, response.error || 'Failed to improve text');
      }
    } catch (error) {
      console.error('Error:', error);
      showModalError(overlay, 'Error improving text. Please try again.');
    } finally {
      improveBtn.disabled = false;
      improveBtn.innerHTML = 'Improve Text';
    }
}

function showModalError(overlay, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'modal-error';
    errorDiv.textContent = message;

    const modalContent = overlay.querySelector('.modal-content');
    if (!modalContent) {
      console.error('showModalError: .modal-content not found in overlay');
      return;
    }

    const existingError = modalContent.querySelector('.modal-error');
    if (existingError) {
      existingError.remove();
    }

    if (modalContent.firstChild) {
      modalContent.insertBefore(errorDiv, modalContent.firstChild);
    } else {
      modalContent.appendChild(errorDiv);
    }

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
}

function showModalSuccess(overlay, message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'modal-success';
    successDiv.textContent = message;

    const existingSuccess = overlay.querySelector('.modal-success');
    if (existingSuccess) {
      existingSuccess.remove();
    }

    overlay.querySelector('.modal-content').insertBefore(successDiv, overlay.querySelector('.modal-content').firstChild);

    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
}

function insertEmailIntoCompose(composeElement, emailContent) {
    // Set the email content
    if (composeElement.contentEditable === 'true') {
      composeElement.innerHTML = emailContent.replace(/\n/g, '<br>');
    } else {
      composeElement.value = emailContent;
    }

    // Trigger change events
    const event = new Event('input', { bubbles: true });
    composeElement.dispatchEvent(event);

    // Focus on the compose element
    composeElement.focus();
}

function initGrammarChecking() {
    // Set up real-time grammar checking
    grammarCheckInterval = setInterval(() => {
      if (currentComposeElement && currentComposeElement.textContent.trim()) {
        checkGrammar(currentComposeElement.textContent);
      }
    }, 5000); // Check every 5 seconds
  }

  async function checkGrammar(text) {
    if (!text.trim()) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'checkGrammar',
        text: text,
            });

      if (response.success) {
        displayGrammarSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Grammar check error:', error);
    }
  }

  function displayGrammarSuggestions(suggestions) {
    const suggestionsContainer = document.querySelector('.grammar-suggestions');
    if (!suggestionsContainer) return;

    if (suggestions.length === 0) {
      suggestionsContainer.innerHTML = '<div class="no-issues">✅ No grammar issues found!</div>';
      return;
    }

    suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item">
                <div class="suggestion-type">${suggestion.type}</div>
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-fix">${suggestion.fix}</div>
                <button class="apply-fix-btn" data-original="${suggestion.text}" data-fix="${suggestion.fix}">Apply Fix</button>
            </div>
        `
      )
      .join('');

    // Add event listeners to apply fix buttons
    suggestionsContainer.querySelectorAll('.apply-fix-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyGrammarFix(btn.dataset.original, btn.dataset.fix);
      });
    });
  }

  async function analyzeTone(text) {
    if (!text.trim()) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeTone',
        text: text,
            });

      if (response.success) {
        displayToneAnalysis(response.analysis);
      }
    } catch (error) {
      console.error('Tone analysis error:', error);
    }
  }

  function displayToneAnalysis(analysis) {
    const toneValue = document.querySelector('.tone-value');
    const toneSuggestions = document.querySelector('.tone-suggestions');

    if (toneValue) {
      toneValue.textContent = analysis.primaryTone;
      toneValue.className = `tone-value tone-${analysis.primaryTone.toLowerCase()}`;
    }

    if (toneSuggestions && analysis.suggestions) {
      toneSuggestions.innerHTML = analysis.suggestions.map(suggestion => `
                <div class="tone-suggestion">
                    <div class="suggestion-icon">💡</div>
                    <div class="suggestion-text">${suggestion}</div>
                </div>
            `
        )
        .join('');
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function observeCompose() {
    // Watch for new compose windows
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this is a new compose area
            const composeElements = node.querySelectorAll('[role="textbox"]');
                         composeElements.forEach(element => {
               if (!element.dataset.smartAssistantAdded &&
                 (element.getAttribute('aria-label')?.includes('Message Body') ||
                   element.getAttribute('aria-label')?.includes('Message body'))) {
                 element.dataset.smartAssistantAdded = 'true';
                 const platform = window.location.hostname === 'mail.google.com' ? 'gmail' : 'outlook';
                 addSmartAssistantButton(element, platform);
                 setupRealTimeChecking(element);
               }
             });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
        });
  }

  function initGmailSmartAssistant() {
    if (window.location.hostname !== 'mail.google.com') return;

    // Start observing for Gmail's smart writing assistant
    observeGmailSmartAssistant();

    // Set up periodic checks for new recommendations
    setInterval(checkForGmailRecommendations, 2000);
  }

  function observeGmailSmartAssistant() {
    // Create a mutation observer to watch for Gmail's smart writing assistant
    gmailAssistantObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Look for Gmail's smart writing assistant elements with comprehensive selectors
            const assistantSelectors = [
              '[data-tooltip*="Smart compose"]',
              '[aria-label*="Smart compose"]',
              '.smart-compose-suggestion',
              '[data-tooltip*="Apply"]',
              '[aria-label*="Apply"]',
              '[data-tooltip*="Accept"]',
              '[aria-label*="Accept"]',
              '[data-tooltip*="Fix"]',
              '[aria-label*="Fix"]',
              '.smart-compose',
              '[role="button"][aria-label*="compose"]',
              '[role="button"][aria-label*="suggestion"]'
            ];

            const assistantElements = node.querySelectorAll ?
              node.querySelectorAll(assistantSelectors.join(', ')) :
              [];

            assistantElements.forEach(element => {
              enhanceGmailAssistant(element);
            });

            // Also check if the node itself is an assistant element
            if (node.matches && node.matches(assistantSelectors.join(', '))) {
              enhanceGmailAssistant(node);
            }
          }
        });
      });
    });

    // Start observing
    gmailAssistantObserver.observe(document.body, {
      childList: true,
      subtree: true,
        });
  }

  function enhanceGmailAssistant(element) {
    if (element.dataset.enhanced) return;
    element.dataset.enhanced = 'true';

    console.log('Enhanced Gmail assistant element:', element);

    // Find apply fix buttons within this element
    const applyButtons = element.querySelectorAll('button[aria-label*="Apply"], button[aria-label*="Accept"], button[aria-label*="Fix"]');

    console.log('Found apply buttons:', applyButtons.length);

    applyButtons.forEach(button => {
      if (!button.dataset.enhanced) {
        button.dataset.enhanced = 'true';

        console.log('Enhancing button:', button.ariaLabel || button.textContent);

        // Store original click handler
        const originalClick = button.onclick;

        // Override click handler
        button.addEventListener('click', async (e) => {
            console.log('Apply fix button clicked!');
          e.preventDefault();
            e.stopPropagation();

            // Apply the fix first
            if (originalClick) {
              originalClick.call(button, e);
          }

            // Wait a moment for the fix to be applied
            await new Promise(resolve => setTimeout(resolve, 500));

            // Update recommendations
            await updateGmailRecommendations();
        }, true);
      }
    });
  }

  async function updateGmailRecommendations() {
    try {
      console.log('Updating Gmail recommendations...');

      // Find the current compose element
      const composeElement = document.querySelector('[role="textbox"][aria-label*="Message Body"]');
      if (!composeElement) {
        console.log('No compose element found');
        return;
      }

      const currentText = composeElement.textContent.trim();
      if (!currentText) {
        console.log('No text to analyze');
        return;
      }

      console.log('Current text:', `${currentText.substring(0, 100)  }...`);

      // Get new recommendations from our AI
      const response = await chrome.runtime.sendMessage({
        action: 'getWritingSuggestions',
        text: currentText,
        context: 'email',
            });

      console.log('AI response:', response);

      if (response.success && response.suggestions.length > 0) {
        console.log('Injecting enhanced recommendations');
        // Inject our enhanced recommendations
        injectEnhancedRecommendations(response.suggestions, composeElement);
      } else {
        console.log('No suggestions received or error occurred');
      }

    } catch (error) {
      console.error('Error updating Gmail recommendations:', error);
    }
  }

  function injectEnhancedRecommendations(suggestions, composeElement) {
    // Remove existing enhanced recommendations
    document.querySelectorAll('.enhanced-smart-assistant').forEach(el => el.remove());

    // Create enhanced recommendations panel
    const panel = document.createElement('div');
    panel.className = 'enhanced-smart-assistant';
    panel.innerHTML = `
            <div class="enhanced-header">
                <span>Enhanced Writing Assistant</span>
                <button class="close-enhanced">×</button>
            </div>
            <div class="enhanced-suggestions">
                ${suggestions
                  .map(
                    suggestion => `
                    <div class="enhanced-suggestion">
                        <div class="suggestion-content">
                            <div class="suggestion-text">${suggestion.text}</div>
                            <div class="suggestion-type">${suggestion.type}</div>
                        </div>
                        <button class="apply-enhanced-fix" data-suggestion="${encodeURIComponent(JSON.stringify(suggestion))}">
                            Apply Fix
                        </button>
                    </div>
                `
                  )
                  .join('')}
            </div>
        `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
            .enhanced-smart-assistant {
                position: absolute;
                top: 100%;
                left: 0;
                width: 400px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .enhanced-header {
                background: linear-gradient(135deg, #3b82f6, #6366f1);
                color: white;
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                font-weight: 600;
            }
            
            .close-enhanced {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .enhanced-suggestions {
                padding: 8px;
            }
            
            .enhanced-suggestion {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                margin-bottom: 4px;
                background: #f8fafc;
                border-radius: 4px;
                border-left: 3px solid #3b82f6;
            }
            
            .suggestion-content {
                flex: 1;
                margin-right: 8px;
            }
            
            .suggestion-text {
                font-size: 12px;
                color: #374151;
                margin-bottom: 2px;
            }
            
            .suggestion-type {
                font-size: 10px;
                color: #6b7280;
                text-transform: uppercase;
            }
            
            .apply-enhanced-fix {
                padding: 4px 8px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 10px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .apply-enhanced-fix:hover {
                background: #2563eb;
            }
        `;

    if (!document.querySelector('#enhanced-smart-assistant-styles')) {
      style.id = 'enhanced-smart-assistant-styles';
      document.head.appendChild(style);
    }

    // Position the panel near the compose element
    const rect = composeElement.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.top = `${rect.bottom + 5  }px`;
    panel.style.left = `${rect.left  }px`;

    document.body.appendChild(panel);

    // Add event listeners
    panel.querySelector('.close-enhanced').addEventListener('click', () => {
      panel.remove();
    });

    panel.querySelectorAll('.apply-enhanced-fix').forEach(button => {
      button.addEventListener('click', () => {
        const suggestion = JSON.parse(decodeURIComponent(button.dataset.suggestion));
        applyEnhancedFix(suggestion, composeElement);
        panel.remove();
      });
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (panel.parentNode) {
        panel.remove();
      }
    }, 10000);
  }

  function applyEnhancedFix(suggestion, composeElement) {
    const original = suggestion.original || suggestion.text;
    const fix = suggestion.text;
    console.log('[Smart Assistant] Attempting to apply enhanced fix:', { original, fix, composeElement });
    let replaced = false;
    if (composeElement.isContentEditable || composeElement.contentEditable === 'true') {
      const text = composeElement.textContent;
      const { body, signature } = splitBodyAndSignature(text);
      const newBody = body.replace(original, fix);
      if (newBody !== body) replaced = true;
      let newText = newBody;
      if (signature) newText += `\n${  signature}`;
      composeElement.textContent = newText;
      if (!replaced) {
        replaced = replaceFirstOccurrenceInContentEditable(composeElement, original, fix);
      }
      if (!replaced) {
        replaced = replaceAcrossAllTextNodes(composeElement, original, fix);
      }
      if (!replaced) {
        composeElement.textContent = composeElement.textContent.replace(original, fix);
        console.log('[Smart Assistant] Fallback: replaced in textContent.');
      }
    } else if (composeElement.value !== undefined) {
      composeElement.value = composeElement.value.replace(original, fix);
      replaced = true;
    } else {
      composeElement.textContent = composeElement.textContent.replace(original, fix);
      replaced = true;
    }
    const event = new Event('input', { bubbles: true });
    composeElement.dispatchEvent(event);
    setTimeout(() => {
      updateGmailRecommendations();
    }, 500);
    if (replaced) {
      console.log('[Smart Assistant] Enhanced fix applied successfully.');
    } else {
      console.log('[Smart Assistant] Enhanced fix may not have been applied.');
    }
  }

  function checkForGmailRecommendations() {
    // Look for Gmail's smart writing assistant elements with more comprehensive selectors
    const assistantSelectors = [
      '[data-tooltip*="Smart compose"]',
      '[aria-label*="Smart compose"]',
      '.smart-compose-suggestion',
      '[data-tooltip*="Apply"]',
      '[aria-label*="Apply"]',
      '[data-tooltip*="Accept"]',
      '[aria-label*="Accept"]',
      '[data-tooltip*="Fix"]',
      '[aria-label*="Fix"]',
      '.smart-compose',
      '[role="button"][aria-label*="compose"]',
      '[role="button"][aria-label*="suggestion"]'
    ];

    const assistantElements = document.querySelectorAll(assistantSelectors.join(', '));

    assistantElements.forEach(element => {
      enhanceGmailAssistant(element);
    });

    // Also look for any buttons that might be apply fix buttons
    const applyButtons = document.querySelectorAll('button[aria-label*="Apply"], button[aria-label*="Accept"], button[aria-label*="Fix"], button[aria-label*="compose"]');
    applyButtons.forEach(button => {
      if (!button.dataset.enhanced) {
        enhanceGmailAssistant(button.parentElement || button);
      }
    });
  }

  // Daily email analysis functions
async function analyzeDailyEmails(overlay) {
    try {
        console.log('[Smart Assistant] Starting daily email analysis...');
        
        // Show loading state
        overlay.querySelector('#total-emails').textContent = 'Scanning...';
        overlay.querySelector('#avg-length').textContent = 'Analyzing...';
        overlay.querySelector('#common-topics').textContent = 'Processing...';
        overlay.querySelector('#daily-insights').textContent = 'Loading insights...';
        
        // Get today's emails
        const todayEmails = await getTodaysEmails();
        console.log('[Smart Assistant] Found emails:', todayEmails.length);
        
        if (todayEmails.length === 0) {
            overlay.querySelector('#total-emails').textContent = '0';
            overlay.querySelector('#avg-length').textContent = 'N/A';
            overlay.querySelector('#common-topics').textContent = 'No emails today';
            overlay.querySelector('#daily-insights').textContent = 'No emails found for today.';
            return;
        }
        
        // Calculate basic stats
        const totalEmails = todayEmails.length;
        const avgLength = Math.round(todayEmails.reduce((sum, email) => sum + email.content.length, 0) / totalEmails);
        
        // Get common topics
        const allContent = todayEmails.map(email => email.content).join(' ');
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeDailyEmails',
            emails: todayEmails,
            allContent: allContent
        });
        
        if (response.success) {
            overlay.querySelector('#total-emails').textContent = totalEmails.toString();
            overlay.querySelector('#avg-length').textContent = `${avgLength} characters`;
            overlay.querySelector('#common-topics').textContent = response.commonTopics || 'Various topics';
            overlay.querySelector('#daily-insights').innerHTML = response.insights || 'Analysis complete';
        } else {
            throw new Error(response.error || 'Failed to analyze emails');
        }
        
    } catch (error) {
        console.error('[Smart Assistant] Daily analysis error:', error);
        overlay.querySelector('#daily-insights').textContent = 'Error analyzing emails. Please try again.';
    }
}

async function getTodaysEmails() {
    const emails = [];
    const today = new Date();
    const todayString = today.toDateString();
    
    // Look for email elements in Gmail
    const emailElements = document.querySelectorAll('[role="row"]');
    
    for (const element of emailElements) {
        try {
            // Check if this is an email row
            const subjectElement = element.querySelector('[data-thread-perm-id]');
            if (!subjectElement) continue;
            
            // Get email data
            const subject = subjectElement.textContent.trim();
            const senderElement = element.querySelector('[email]');
            const sender = senderElement ? senderElement.getAttribute('email') : 'Unknown';
            
            // Get date element
            const dateElement = element.querySelector('[title*=":"]');
            let emailDate = null;
            
            if (dateElement) {
                const dateText = dateElement.getAttribute('title') || dateElement.textContent;
                // Parse date (Gmail format: "Jan 15, 2024, 2:30 PM")
                const dateMatch = dateText.match(/(\w{3}\s+\d{1,2},\s+\d{4})/);
                if (dateMatch) {
                    emailDate = new Date(dateMatch[1]);
                }
            }
            
            // Only include today's emails
            if (emailDate && emailDate.toDateString() === todayString) {
                // Try to get email content (this might require opening the email)
                let content = subject; // Default to subject
                
                // Try to get preview text
                const previewElement = element.querySelector('[data-legacy-thread-id]');
                if (previewElement) {
                    const preview = previewElement.textContent.trim();
                    if (preview) {
                        content = `${subject}\n\n${preview}`;
                    }
                }
                
                emails.push({
                    subject: subject,
                    sender: sender,
                    date: emailDate,
                    content: content
                });
            }
        } catch (error) {
            console.warn('[Smart Assistant] Error processing email element:', error);
        }
    }
    
    console.log('[Smart Assistant] Found emails for today:', emails.length);
    return emails;
}

async function generateDailySummary(overlay) {
    try {
        const todayEmails = await getTodaysEmails();
        if (todayEmails.length === 0) {
            showModalError(overlay, 'No emails found for today');
            return;
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'generateDailySummary',
            emails: todayEmails
        });
        
        if (response.success) {
            overlay.querySelector('#daily-insights').innerHTML = response.summary;
        } else {
            showModalError(overlay, response.error || 'Failed to generate summary');
        }
    } catch (error) {
        console.error('[Smart Assistant] Summary generation error:', error);
        showModalError(overlay, 'Error generating summary');
    }
}

async function findDailyPatterns(overlay) {
    try {
        const todayEmails = await getTodaysEmails();
        if (todayEmails.length === 0) {
            showModalError(overlay, 'No emails found for today');
            return;
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'findDailyPatterns',
            emails: todayEmails
        });
        
        if (response.success) {
            overlay.querySelector('#daily-insights').innerHTML = response.patterns;
        } else {
            showModalError(overlay, response.error || 'Failed to find patterns');
        }
    } catch (error) {
        console.error('[Smart Assistant] Pattern analysis error:', error);
        showModalError(overlay, 'Error finding patterns');
    }
}

async function suggestDailyImprovements(overlay) {
    try {
        const todayEmails = await getTodaysEmails();
        if (todayEmails.length === 0) {
            showModalError(overlay, 'No emails found for today');
            return;
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'suggestDailyImprovements',
            emails: todayEmails
        });
        
        if (response.success) {
            overlay.querySelector('#daily-insights').innerHTML = response.suggestions;
        } else {
            showModalError(overlay, response.error || 'Failed to generate suggestions');
        }
    } catch (error) {
        console.error('[Smart Assistant] Improvement suggestions error:', error);
        showModalError(overlay, 'Error generating suggestions');
    }
}

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (grammarCheckInterval) {
      clearInterval(grammarCheckInterval);
    }
    // Remove suggestion panel
    if (suggestionsPanel) {
      suggestionsPanel.remove();
    }
  });
})();
