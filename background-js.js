// Enhanced background script with grammar checking, text improvement, and Gmail analysis
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateEmail') {
    generateEmailWithAPI(request.thoughts, request.tone)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'improveText') {
    improveTextWithAPI(request.text, request.options)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'checkGrammar') {
    checkGrammarWithAPI(request.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'analyzeTone') {
    analyzeToneWithAPI(request.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'getWritingSuggestions') {
    getWritingSuggestionsWithAPI(request.text, request.context)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'analyzeEmails') {
    handleEmailAnalysis(request, sendResponse);
    return true;
  } else if (request.action === 'authenticateGmail') {
    handleGmailAuth(sendResponse);
    return true;
  } else if (request.action === 'testGmailConnection') {
    testGmailConnection(sendResponse);
    return true;
  } else if (request.action === 'clearEmailCache') {
    clearEmailCache(sendResponse);
    return true;
  } else if (request.action === 'getEmailCacheStatus') {
    getEmailCacheStatus(sendResponse);
    return true;
  } else if (request.action === 'loadCachedAnalysis') {
    loadCachedAnalysis(sendResponse);
    return true;
  } else if (request.action === 'analyzeDailyEmails') {
    analyzeDailyEmailsWithAPI(request.emails, request.allContent)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'generateDailySummary') {
    generateDailySummaryWithAPI(request.emails)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'findDailyPatterns') {
    findDailyPatternsWithAPI(request.emails)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'suggestDailyImprovements') {
    suggestDailyImprovementsWithAPI(request.emails)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'deleteSpamEmail') {
    handleSpamEmailDeletion(request, sendResponse);
    return true;
  }
});

async function generateEmailWithAPI(thoughts, tone) {
  try {
    const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set it in the extension options.');
    }

    const prompt = `You are an expert email writer. Transform the following raw thoughts into a well-crafted email with a ${tone} tone.\n\nRaw thoughts: "${thoughts}"\n\nInstructions:\n- Write a complete, professional email body\n- Use a ${tone} tone throughout\n- Make it clear, engaging, and well-structured\n- Ensure proper email etiquette\n- Do not include a subject line\n- Keep it concise but comprehensive\n\nRespond with ONLY the email body content. Do not include any explanations or additional text outside of the email.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert writing assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedEmail = data.choices[0].message.content.trim();

    return {
      success: true,
      email: generatedEmail,
    };
  } catch (error) {
    console.error('Error generating email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function improveTextWithAPI(text, options) {
  try {
    const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set it in the extension options.');
    }

    const improvements = options.join(', ');
    const prompt = `You are an expert writing assistant. Improve the following text by focusing on: ${improvements}.\n\nOriginal text: "${text}"\n\nInstructions:\n- Fix any grammar issues\n- Improve clarity and readability\n- Enhance the writing style\n- Maintain the original meaning and tone\n- Make the text more professional and polished\n- Keep the same length or slightly shorter\n\nRespond with ONLY the improved text. Do not include any explanations or markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert writing assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const improvedText = data.choices[0].message.content.trim();

    return {
      success: true,
      improvedText,
    };
  } catch (error) {
    console.error('Error improving text:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function extractJSONFromResponse(text) {
  // Remove code block markers and trim
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned
      .replace(/^```json/, '')
      .replace(/```$/, '')
      .trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }
  // Try to find the first and last curly braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

async function checkGrammarWithAPI(text) {
  try {
    const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set it in the extension options.');
    }

    const prompt = `You are an expert grammar checker. Analyze the following text for grammar, spelling, and style issues.\n\nText: "${text}"\n\nInstructions:\n- Identify grammar errors, spelling mistakes, and style issues\n- Provide specific suggestions for improvement\n- Focus on common issues like subject-verb agreement, punctuation, word choice\n- Return the results in JSON format with the following structure:\n{\n  "suggestions": [\n    {\n      "type": "Grammar|Spelling|Style",\n      "text": "the problematic text",\n      "fix": "the corrected version"\n    }\n  ]\n}\n\nOnly return valid JSON. Do not include any other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert grammar checker.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let result;
    try {
      const cleaned = extractJSONFromResponse(data.choices[0].message.content);
      result = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse grammar suggestions JSON.');
    }

    return {
      success: true,
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error('Error checking grammar:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function analyzeToneWithAPI(text) {
  try {
    const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set it in the extension options.');
    }

    const prompt = `You are an expert in analyzing writing tone and style. Analyze the tone of the following text.\n\nText: "${text}"\n\nInstructions:\n- Identify the primary tone (Professional, Friendly, Formal, Casual, Confident, etc.)\n- Provide specific suggestions for tone improvement\n- Consider word choice, sentence structure, and overall writing style\n- Return the results in JSON format with the following structure:\n{\n  "primaryTone": "Professional",\n  "suggestions": [\n    "Consider using more active voice",\n    "Add more specific details to strengthen your message"\n  ]\n}\n\nOnly return valid JSON. Do not include any other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert in analyzing writing tone and style.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let result;
    try {
      const cleaned = extractJSONFromResponse(data.choices[0].message.content);
      result = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse tone analysis JSON.');
    }

    return {
      success: true,
      analysis: {
        primaryTone: result.primaryTone || 'Neutral',
        suggestions: result.suggestions || [],
      }
    };
  } catch (error) {
    console.error('Error analyzing tone:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function getWritingSuggestionsWithAPI(text, context = 'email') {
  try {
    const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set it in the extension options.');
    }

    const prompt = `You are an expert writing assistant. Analyze the following ${context} text and provide specific writing suggestions.\n\nText: "${text}"\n\nInstructions:\n- Provide 2-4 specific, actionable writing suggestions\n- Focus on grammar, style, clarity, and tone improvements\n- Make suggestions that can be applied immediately\n- Consider the context (${context})\n- Return the results in JSON format with the following structure:\n{\n  "suggestions": [\n    {\n      "type": "replacement|insertion|improvement",\n      "text": "the suggested text or improvement",\n      "original": "the original text (for replacement type)",\n      "description": "brief explanation of the suggestion"\n    }\n  ]\n}\n\nOnly return valid JSON. Do not include any other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert writing assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    let result;
    try {
      const cleaned = extractJSONFromResponse(data.choices[0].message.content);
      result = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse writing suggestions JSON.');
    }

    return {
      success: true,
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error('Error getting writing suggestions:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Writing Assistant installed');

  // Set default settings
  chrome.storage.sync.set({
    defaultTone: 'professional',
    autoGrammarCheck: true,
    showSuggestions: true,
  });
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Smart Writing Assistant started');
});

// Gmail Analysis Service
class GmailAnalysisService {
  constructor() {
    this.GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1';
  }

  async authenticateGmail() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, token => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }

  async getRecentEmails(token, hoursBack = 24) {
    let timeThreshold;
    
    if (hoursBack === 0) {
      // Get emails from the start of today
      timeThreshold = new Date();
      timeThreshold.setHours(0, 0, 0, 0);
    } else {
      // Get emails from the last N hours
      timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - hoursBack);
    }
    
    const query = `after:${Math.floor(timeThreshold.getTime() / 1000)}`;

    try {
      const response = await fetch(
        `${this.GMAIL_API_BASE}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        },
      );

      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      return [];
    }
  }

  async getEmailDetails(token, messageId) {
    try {
      const response = await fetch(
        `${this.GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        },
      );

      if (!response.ok) throw new Error('Failed to fetch email details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching email details:', error);
      return null;
    }
  }

  parseEmailData(emailData) {
    const headers = emailData.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Extract email body
    let body = '';
    if (emailData.payload?.body?.data) {
      body = atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (emailData.payload?.parts) {
      const textPart = emailData.payload.parts.find(
        part => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart?.body?.data) {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }

    return {
      id: emailData.id,
      subject,
      from,
      date,
      body: body.substring(0, 1000), // Limit body length
      snippet: emailData.snippet || '',
    };
  }
}

async function handleGmailAuth(sendResponse) {
  try {
    const gmailService = new GmailAnalysisService();
    const token = await gmailService.authenticateGmail();
    sendResponse({ success: true, token });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function testGmailConnection(sendResponse) {
  try {
    const gmailService = new GmailAnalysisService();
    const token = await gmailService.authenticateGmail();

    // Test the Gmail API connection
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const profile = await response.json();
      sendResponse({
        success: true,
        message: `Connected successfully! Email: ${profile.emailAddress}`,
      });
    } else {
      sendResponse({
        success: false,
        error: `Gmail API error: ${response.status}`,
      });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleEmailAnalysis(request, sendResponse) {
  try {
    const gmailService = new GmailAnalysisService();
    const { token } = request;

    // Check if we have cached analysis and if it's still valid
    const cachedData = await chrome.storage.local.get([
      'emailAnalysisCache',
      'emailAnalysisTimestamp',
    ]);
    const now = Date.now();
    const cacheAge = now - (cachedData.emailAnalysisTimestamp || 0);
    const cacheValidDuration = 30 * 60 * 1000; // 30 minutes

    // If we have valid cached data, return it
    if (cachedData.emailAnalysisCache && cacheAge < cacheValidDuration) {
      console.log('Returning cached email analysis');
      sendResponse({
        success: true,
        analysis: cachedData.emailAnalysisCache.analysis,
        emailCount: cachedData.emailAnalysisCache.emailCount,
        allEmails: cachedData.emailAnalysisCache.allEmails || [], // Include all emails for viewing
        cached: true,
        cacheAge: Math.round(cacheAge / 60000), // minutes
      });
      return;
    }

    // Get recent emails from today
    const messages = await gmailService.getRecentEmails(token, 0);
    const emailDetails = [];

    // Get details for up to 20 most recent emails
    for (const message of messages.slice(0, 20)) {
      const details = await gmailService.getEmailDetails(token, message.id);
      if (details) {
        emailDetails.push(gmailService.parseEmailData(details));
      }
    }

    // Analyze emails with OpenAI (using your existing function)
    const analysis = await analyzeEmailsWithAI(emailDetails);

    // Cache the results
    const cacheData = {
      analysis,
      emailCount: emailDetails.length,
      allEmails: emailDetails, // Store all emails for viewing
      timestamp: now,
    };

    await chrome.storage.local.set({
      emailAnalysisCache: cacheData,
      emailAnalysisTimestamp: now,
    });

    sendResponse({
      success: true,
      analysis,
      emailCount: emailDetails.length,
      allEmails: emailDetails, // Include all emails for viewing
      cached: false,
    });
  } catch (error) {
    console.error('Email analysis error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function analyzeEmailsWithAI(emails) {
  // Get API key from storage (using your existing pattern)
  const result = await chrome.storage.sync.get(['openaiApiKey']);
  const apiKey = result.openaiApiKey;

  if (!apiKey) {
    throw new Error(
      'OpenAI API key not configured. Please set your API key in the extension options.'
    );
  }

  if (!apiKey.startsWith('sk-')) {
    throw new Error(
      'Invalid OpenAI API key format. Please check your API key in the extension options.'
    );
  }

  const emailSummary = emails
    .map(email => `From: ${email.from}\nSubject: ${email.subject}\nSnippet: ${email.snippet}`)
    .join('\n\n---\n\n');

  const prompt = `Analyze these recent emails and create a prioritized to-do list. For each email, determine:

1. Category: SALES, INFO, PROMO, URGENT, MEETING, SPAM, or OTHER
2. Priority: HIGH, MEDIUM, or LOW  
3. Action needed (if any)
4. Deadline (if mentioned or implied)
5. Whether it's SPAM (unsolicited promotional, phishing, suspicious content)

For spam detection, look for:
- Unsolicited promotional content
- Suspicious sender patterns
- Generic/bulk email indicators
- Phishing attempts
- Misleading subject lines
- Excessive promotional language

Focus on emails that require action, response, or follow-up for actionable items. Classify obvious spam separately.

Emails to analyze:
${emailSummary}

Respond in JSON format:
{
  "todos": [
    {
      "id": "email_id_here",
      "subject": "email subject",
      "from": "sender name/email", 
      "category": "SALES|INFO|PROMO|URGENT|MEETING|SPAM|OTHER",
      "priority": "HIGH|MEDIUM|LOW",
      "action": "specific action needed",
      "deadline": "deadline if any",
      "context": "brief context/summary",
      "isSpam": false
    }
  ],
  "spam": [
    {
      "id": "email_id_here",
      "subject": "email subject",
      "from": "sender name/email",
      "reason": "why it's classified as spam",
      "context": "brief context/summary",
      "spamType": "promotional|phishing|suspicious|bulk"
    }
  ],
  "summary": {
    "totalEmails": 0,
    "actionableEmails": 0,
    "spamEmails": 0,
    "categories": {
      "SALES": 0,
      "INFO": 0,
      "PROMO": 0,
      "URGENT": 0,
      "MEETING": 0,
      "SPAM": 0,
      "OTHER": 0
    }
  }
}`;

  try {
    // Use your existing OpenAI API call pattern
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email analysis assistant. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If we can't parse the error response, use the status
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw error;
  }
}

async function clearEmailCache(sendResponse) {
  try {
    await chrome.storage.local.remove(['emailAnalysisCache', 'emailAnalysisTimestamp']);
    sendResponse({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function getEmailCacheStatus(sendResponse) {
  try {
    const cachedData = await chrome.storage.local.get([
      'emailAnalysisCache',
      'emailAnalysisTimestamp',
    ]);
    const now = Date.now();
    const cacheAge = now - (cachedData.emailAnalysisTimestamp || 0);
    const cacheValidDuration = 30 * 60 * 1000; // 30 minutes

    if (cachedData.emailAnalysisCache && cacheAge < cacheValidDuration) {
      const ageMinutes = Math.round(cacheAge / 60000);
      const remainingMinutes = Math.round((cacheValidDuration - cacheAge) / 60000);
      sendResponse({
        success: true,
        hasCache: true,
        ageMinutes,
        remainingMinutes,
        emailCount: cachedData.emailAnalysisCache.emailCount,
      });
    } else {
      sendResponse({ success: true, hasCache: false });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function loadCachedAnalysis(sendResponse) {
  try {
    const cachedData = await chrome.storage.local.get(['emailAnalysisCache']);

    if (cachedData.emailAnalysisCache) {
      sendResponse({
        success: true,
        analysis: cachedData.emailAnalysisCache.analysis,
        emailCount: cachedData.emailAnalysisCache.emailCount,
        allEmails: cachedData.emailAnalysisCache.allEmails || [],
      });
    } else {
      sendResponse({ success: false, error: 'No cached analysis found' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Daily email analysis functions
async function analyzeDailyEmailsWithAPI(emails, allContent) {
    try {
        const prompt = `Analyze the following emails from today and provide insights:

Emails: ${JSON.stringify(emails, null, 2)}

All Content: ${allContent}

Please provide:
1. Common topics/themes (3-5 most frequent)
2. Key insights about communication patterns
3. Writing style observations
4. Any notable trends

Format your response as JSON with these fields:
{
  "commonTopics": ["topic1", "topic2", "topic3"],
  "insights": "Detailed insights about the emails...",
  "writingStyle": "Observations about writing style...",
  "trends": "Notable trends or patterns..."
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert email analyst. Analyze the provided emails and provide insights in the requested JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const aiResponse = data.choices[0].message.content;
        const parsedResponse = extractJSONFromResponse(aiResponse);
        
        return {
            success: true,
            commonTopics: parsedResponse.commonTopics?.join(', ') || 'Various topics',
            insights: parsedResponse.insights || 'Analysis complete',
            writingStyle: parsedResponse.writingStyle || '',
            trends: parsedResponse.trends || ''
        };
    } catch (error) {
        console.error('Daily email analysis error:', error);
        return { success: false, error: error.message };
    }
}

async function generateDailySummaryWithAPI(emails) {
    try {
        const prompt = `Generate a comprehensive summary of today's emails:

Emails: ${JSON.stringify(emails, null, 2)}

Please provide:
1. Executive summary of key communications
2. Important themes and topics
3. Action items or follow-ups needed
4. Communication effectiveness insights

Format as a well-structured summary with clear sections.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert email analyst. Generate comprehensive summaries of email communications.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.4
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            summary: data.choices[0].message.content
        };
    } catch (error) {
        console.error('Daily summary generation error:', error);
        return { success: false, error: error.message };
    }
}

async function findDailyPatternsWithAPI(emails) {
    try {
        const prompt = `Analyze these emails to identify communication patterns:

Emails: ${JSON.stringify(emails, null, 2)}

Please identify:
1. Communication patterns (frequency, timing, style)
2. Recipient patterns (who you communicate with most)
3. Content patterns (types of messages, common phrases)
4. Response patterns (if applicable)
5. Efficiency patterns (email length, complexity)

Format as a detailed analysis with specific examples.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in communication pattern analysis. Identify meaningful patterns in email communications.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.3
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            patterns: data.choices[0].message.content
        };
    } catch (error) {
        console.error('Pattern analysis error:', error);
        return { success: false, error: error.message };
    }
}

async function suggestDailyImprovementsWithAPI(emails) {
    try {
        const prompt = `Analyze these emails and suggest improvements:

Emails: ${JSON.stringify(emails, null, 2)}

Please provide specific suggestions for:
1. Writing style improvements
2. Communication efficiency
3. Email organization and structure
4. Tone and professionalism
5. Time management and response patterns

Format as actionable recommendations with examples.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in email communication and productivity. Provide actionable improvement suggestions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.4
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            suggestions: data.choices[0].message.content
        };
    } catch (error) {
        console.error('Improvement suggestions error:', error);
        return { success: false, error: error.message };
    }
}

async function handleSpamEmailDeletion(request, sendResponse) {
  try {
    const gmailService = new GmailAnalysisService();
    
    // Get authentication token
    const token = await gmailService.authenticateGmail();
    
    // Delete the email using Gmail API
    const response = await fetch(
      `${gmailService.GMAIL_API_BASE}/users/me/messages/${request.emailId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (response.ok) {
      sendResponse({ 
        success: true, 
        message: 'Email deleted successfully' 
      });
    } else {
      const errorData = await response.text();
      sendResponse({ 
        success: false, 
        error: `Failed to delete email: ${response.status} ${errorData}` 
      });
    }
  } catch (error) {
    console.error('Error deleting spam email:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}
