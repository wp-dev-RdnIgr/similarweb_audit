const puppeteer = require('puppeteer');

// Configuration from environment variables
const CONFIG = {
  similarweb: {
    email: process.env.SIMILARWEB_EMAIL,
    password: process.env.SIMILARWEB_PASSWORD,
    loginUrl: 'https://account.similarweb.com/login'
  },
  browseAi: {
    apiKey: process.env.BROWSE_AI_API_KEY,
    robotId: process.env.BROWSE_AI_ROBOT_ID,
    apiUrl: 'https://api.browse.ai/v2/robots'
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  }
};

// Validate environment variables
function validateConfig() {
  const required = [
    'SIMILARWEB_EMAIL',
    'SIMILARWEB_PASSWORD',
    'BROWSE_AI_API_KEY',
    'BROWSE_AI_ROBOT_ID'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

// Send Telegram notification
async function sendTelegramNotification(message, isError = false) {
  if (!CONFIG.telegram.botToken || !CONFIG.telegram.chatId) {
    console.log('Telegram not configured, skipping notification');
    return;
  }

  const emoji = isError ? '❌' : '✅';
  const text = `${emoji} <b>SimilarWeb Cookie Refresh</b>\n\n${message}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CONFIG.telegram.chatId,
          text: text,
          parse_mode: 'HTML'
        })
      }
    );

    if (!response.ok) {
      console.error('Telegram notification failed:', await response.text());
    } else {
      console.log('Telegram notification sent');
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error.message);
  }
}

// Login to SimilarWeb and get cookies
async function getSimilarWebCookies() {
  console.log('Launching browser...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ]
  });

  try {
    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to SimilarWeb login page...');
    await page.goto(CONFIG.similarweb.loginUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for login form
    console.log('Waiting for login form...');
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 30000 });

    // Enter email
    console.log('Entering email...');
    const emailSelector = await page.$('input[type="email"]') ||
                          await page.$('input[name="email"]') ||
                          await page.$('#email');
    await emailSelector.type(CONFIG.similarweb.email, { delay: 50 });

    // Enter password
    console.log('Entering password...');
    const passwordSelector = await page.$('input[type="password"]') ||
                             await page.$('input[name="password"]') ||
                             await page.$('#password');
    await passwordSelector.type(CONFIG.similarweb.password, { delay: 50 });

    // Click login button
    console.log('Clicking login button...');
    const loginButton = await page.$('button[type="submit"]') ||
                        await page.$('input[type="submit"]') ||
                        await page.$('[data-testid="login-button"]');

    if (loginButton) {
      await loginButton.click();
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
    }

    // Wait for navigation after login
    console.log('Waiting for login to complete...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    // Additional wait to ensure all cookies are set
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if login was successful by looking for dashboard elements or URL change
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    if (currentUrl.includes('login') || currentUrl.includes('error')) {
      throw new Error('Login may have failed - still on login page');
    }

    // Get all cookies
    console.log('Extracting cookies...');
    const cookies = await page.cookies();

    // Filter relevant cookies (similarweb domain)
    const relevantCookies = cookies.filter(cookie =>
      cookie.domain.includes('similarweb') ||
      cookie.domain.includes('account.similarweb')
    );

    console.log(`Found ${relevantCookies.length} SimilarWeb cookies`);

    return relevantCookies;

  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Convert Puppeteer cookies to Browse.ai format
function convertCookiesForBrowseAi(puppeteerCookies) {
  return puppeteerCookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path || '/',
    secure: cookie.secure || false,
    httpOnly: cookie.httpOnly || false,
    hostOnly: !cookie.domain.startsWith('.'),
    // Convert expiration: Puppeteer uses seconds, Browse.ai expects seconds since epoch
    ...(cookie.expires && cookie.expires > 0 ? { expirationDate: Math.floor(cookie.expires) } : {})
  }));
}

// Update cookies in Browse.ai robot
async function updateBrowseAiCookies(cookies) {
  const url = `${CONFIG.browseAi.apiUrl}/${CONFIG.browseAi.robotId}/cookies`;

  console.log(`Updating cookies for robot ${CONFIG.browseAi.robotId}...`);
  console.log(`Sending ${cookies.length} cookies to Browse.ai`);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CONFIG.browseAi.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cookies)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Browse.ai API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Browse.ai response:', JSON.stringify(result, null, 2));

  return result;
}

// Main function
async function main() {
  console.log('='.repeat(50));
  console.log('SimilarWeb Cookie Refresh Script');
  console.log('='.repeat(50));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Validate configuration
    validateConfig();

    // Step 1: Get cookies from SimilarWeb
    const puppeteerCookies = await getSimilarWebCookies();

    if (puppeteerCookies.length === 0) {
      throw new Error('No cookies extracted from SimilarWeb');
    }

    // Step 2: Convert cookies to Browse.ai format
    const browseAiCookies = convertCookiesForBrowseAi(puppeteerCookies);

    // Log cookie names (not values for security)
    console.log('Cookies to update:', browseAiCookies.map(c => c.name).join(', '));

    // Step 3: Update cookies in Browse.ai
    await updateBrowseAiCookies(browseAiCookies);

    console.log('');
    console.log('SUCCESS: Cookies updated successfully!');
    console.log(`Finished at: ${new Date().toISOString()}`);

    // Send success notification
    const successMessage = `🍪 Cookies обновлены успешно!\n\n` +
      `📊 Обновлено: ${browseAiCookies.length} cookies\n` +
      `🤖 Robot ID: <code>${CONFIG.browseAi.robotId}</code>\n` +
      `🕐 Время: ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`;

    await sendTelegramNotification(successMessage);

  } catch (error) {
    console.error('');
    console.error('ERROR:', error.message);
    console.error(error.stack);

    // Send error notification
    const errorMessage = `Ошибка обновления cookies!\n\n` +
      `❗ ${error.message}\n` +
      `🕐 Время: ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`;

    await sendTelegramNotification(errorMessage, true);

    process.exit(1);
  }
}

// Run
main();
