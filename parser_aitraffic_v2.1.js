// Парсер AI Traffic данных v2.1
// Обновлен для новых роботов Browse.ai
const input = $input.first().json;

const body = input.body || input;
const taskStatus = body?.task?.status || input.taskStatus;
const inputSites = input.sites || [];

// Early return with proper format if not successful
if (taskStatus !== 'successful' && taskStatus !== 'completed') {
  return [{
    json: {
      error: 'Task not successful',
      taskStatus,
      sheetsRows: []
    }
  }];
}

const rawData = body?.task?.capturedTexts || {};
const taskId = body?.task?.id || input.taskId || 'unknown';
const originUrl = body?.task?.inputParameters?.originUrl || input.originUrl || '';

const keyMatch = originUrl.match(/key=([^&]+)/);
let sitesFromUrl = [];
if (keyMatch) {
  sitesFromUrl = decodeURIComponent(keyMatch[1]).split(',');
}
const clientSite = sitesFromUrl[0] || '';

// Извлекаем queueId для связки с очередью
const qidMatch = originUrl.match(/qid=([^&]+)/);
const queueId = qidMatch ? qidMatch[1] : '';

let periodFormatted = '';
const periodUrlMatch = originUrl.match(/\/804\/(\d{4}\.\d{2})-/);
if (periodUrlMatch) {
  periodFormatted = periodUrlMatch[1];
}

let data = {};
if (Array.isArray(rawData)) {
  rawData.forEach(item => {
    const key = item.name || item.key;
    const value = item.newText || item.text || item.value;
    if (key && value) data[key] = value;
  });
} else {
  data = rawData;
}

// Универсальная функция извлечения данных AI Traffic
function extractLegendData(html) {
  if (!html) return {};
  const sites = {};

  const patterns = [
    // data-automation атрибуты (стабильные)
    /data-automation-title="true"[^>]*>([^<]+)<\/label>[\s\S]*?data-automation-value="true"[^>]*>([^<]+)<\/label>/gs,
    // Динамические классы SimilarWeb
    /class="[^"]*"[^>]*>([a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,})<\/label>[\s\S]{0,200}?<label[^>]*class="[^"]*"[^>]*>([\d,]+|N\/A)<\/label>/g,
    // Fallback: label пары с доменами
    /<label[^>]*>([a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,})<\/label>[\s\S]{0,200}?<label[^>]*>([\d,]+|N\/A)<\/label>/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const site = match[1].trim();
      const value = match[2].trim();
      if (site && value && site.includes('.') && /^[a-zA-Z0-9]/.test(site)) {
        if (!sites[site]) sites[site] = value;
      }
    }
  });
  return sites;
}

const aiTraffic = extractLegendData(data['Avg Traffic']);
const today = new Date().toISOString().split('T')[0];

// Собираем сайты с fallback
const allSites = Object.keys(aiTraffic);
if (allSites.length === 0 && sitesFromUrl.length > 0) {
  sitesFromUrl.forEach(site => allSites.push(site));
}
if (allSites.length === 0 && inputSites.length > 0) {
  inputSites.forEach(site => allSites.push(site));
}

const sheetsRows = allSites.map((site) => ({
  'key': `${periodFormatted}_${site}`,
  'client_site': clientSite,
  'AI Traffic': aiTraffic[site] || 'N/A'
}));

return [{
  json: {
    taskId,
    queueId,
    type: 'aitraffic',
    clientSite,
    periodFormatted,
    aiTraffic,
    sheetsRows,
    raw: data
  }
}];
