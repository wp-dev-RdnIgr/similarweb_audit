// Парсер Performance данных v3.1
// Поддержка Engagement данных с fallback на Engagement 2
const input = $input.first().json;

const body = input.body || input;
const rawData = body?.task?.capturedTexts || {};
const taskId = body?.task?.id || input.taskId || 'unknown';
const originUrl = body?.task?.inputParameters?.originUrl || input.originUrl || '';
const inputSites = input.sites || [];

const keyMatch = originUrl.match(/key=([^&]+)/);
let sitesFromUrl = [];
if (keyMatch) {
  sitesFromUrl = decodeURIComponent(keyMatch[1]).split(',');
}
const clientSite = sitesFromUrl[0] || '';

const qidMatch = originUrl.match(/qid=([^&]+)/);
const queueId = qidMatch ? qidMatch[1] : '';

const periodUrlMatch = originUrl.match(/\/804\/(\d{4}\.\d{2})-\d{4}\.\d{2}/);
let periodFormatted = '';
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

function isLoading(html) {
  if (!html) return true;
  return html.includes('LoadingContainer') || html.includes('linearGradient id="lineGray"');
}

function extractLegendData(html) {
  if (!html) return {};
  const sites = {};
  const patterns = [
    /data-automation-title="true"[^>]*>([^<]+)<\/label>[\s\S]*?data-automation-value="true"[^>]*>([^<]+)<\/label>/g,
    /class="[^"]*lfbxrA[^"]*">([^<]+)<\/label>[\s\S]{0,300}?class="[^"]*gzsEum[^"]*">([^<]+)<\/label>/g,
    /class="[^"]*iUaIjL[^"]*">([^<]+)<\/label>[\s\S]{0,300}?class="[^"]*gzsEum[^"]*">([^<]+)<\/label>/g
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

function extractEngagementData(html) {
  if (!html || isLoading(html)) return null;
  const result = {};
  const domainPattern = /DomainWrapper[^>]*>\s*([a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*<\/span>/g;
  const domains = [];
  let match;
  while ((match = domainPattern.exec(html)) !== null) {
    domains.push(match[1].trim());
  }
  if (domains.length === 0) return null;
  domains.forEach(domain => {
    result[domain] = {};
    const escapedDomain = domain.replace(/\./g, '\\.');
    const cellPattern = new RegExp(
      `data-automation="MiniFlexTable-cell ${escapedDomain}"[^>]*>[\\s\\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)</span>`,
      'g'
    );
    const values = [];
    let cellMatch;
    while ((cellMatch = cellPattern.exec(html)) !== null) {
      let value = cellMatch[1]
        .replace(/<svg[\s\S]*?<\/svg>/g, '')
        .replace(/<div[\s\S]*?<\/div>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      values.push(value);
    }
    if (values.length >= 7) {
      result[domain] = {
        monthlyVisits: values[0] || '',
        uniqueVisitors: values[1] || '',
        visitsPerVisitor: values[2] || '',
        deduplicatedAudience: values[3] || '',
        visitDuration: values[4] || '',
        pagesPerVisit: values[5] || '',
        bounceRate: values[6] || '',
        pageViews: values[7] || ''
      };
    }
  });
  return result;
}

const direct = extractLegendData(data['Direct']);
const organicSearch = extractLegendData(data['Organic Search']);
const paidSearch = extractLegendData(data['Paid Search']);
const displayAds = extractLegendData(data['Display Ads'] || data['Display Search']);
const social = extractLegendData(data['Social'] || data['Sosial']);
const email = extractLegendData(data['Email']);

let engagement = null;
if (!isLoading(data['Engagement'])) {
  engagement = extractEngagementData(data['Engagement']);
}
if (!engagement && data['Engagement 2']) {
  engagement = extractEngagementData(data['Engagement 2']);
}

const today = new Date().toISOString().split('T')[0];

const allSites = new Set();
[direct, organicSearch, paidSearch, displayAds, social, email].forEach(channel => {
  Object.keys(channel).forEach(site => allSites.add(site));
});
if (engagement) {
  Object.keys(engagement).forEach(site => allSites.add(site));
}
// Fallback: use sitesFromUrl
if (allSites.size === 0 && sitesFromUrl.length > 0) {
  sitesFromUrl.forEach(site => allSites.add(site));
}
// Fallback: use input.sites
if (allSites.size === 0 && inputSites.length > 0) {
  inputSites.forEach(site => allSites.add(site));
}

const sitesArray = Array.from(allSites);

const sheetsRows = sitesArray.map((site) => {
  const eng = engagement?.[site] || {};
  return {
    'date': today,
    'period': periodFormatted,
    'client_site': clientSite,
    'site': site,
    'type': site === clientSite ? 'client' : 'competitor',
    'Monthly Visits': eng.monthlyVisits || '',
    'Unique Visitors': eng.uniqueVisitors || '',
    'Visit Duration': eng.visitDuration || '',
    'Pages/Visit': eng.pagesPerVisit || '',
    'Bounce Rate': eng.bounceRate || '',
    'Direct': direct[site] || '',
    'Organic Search': organicSearch[site] || '',
    'Paid Search': paidSearch[site] || '',
    'Display Ads': displayAds[site] || '',
    'Social': social[site] || '',
    'Email': email[site] || '',
    'Task ID': taskId,
    'Queue ID': queueId,
    'key': `${periodFormatted}_${site}`
  };
});

return [{
  json: {
    taskId,
    queueId,
    type: 'performance',
    periodFormatted,
    clientSite,
    engagement,
    channels: { direct, organicSearch, paidSearch, displayAds, social, email },
    sheetsRows,
    raw: data
  }
}];
