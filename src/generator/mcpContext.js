/**
 * Optional WebSquare MCP context provider.
 *
 * The answer pipeline must keep working when the internal MCP server is
 * unavailable, so every failure is converted into a status object instead of
 * throwing.
 */

const { execFileSync } = require('child_process');
const fetch = require('node-fetch');
const { loadConfig } = require('../utils/config');
const { maskSensitiveInfo } = require('../utils/masking');

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_ITEMS = 5;

const COMPONENT_ALIASES = [
  { pattern: /\bgrid\s*view\b|\bgridview\b|\bgridView\b|그리드/i, component: 'gridView' },
  { pattern: /\bgridView\/column\b|\bcolumn\b|컬럼/i, component: 'gridView/column' },
  { pattern: /\bdata\s*list\b|\bdataList\b|데이터리스트/i, component: 'dataList' },
  { pattern: /\bdata\s*map\b|\bdataMap\b|데이터맵/i, component: 'dataMap' },
  { pattern: /\bsubmission\b|서브미션/i, component: 'Submission' },
  { pattern: /\$p\b|openPopup|executeSubmission/i, component: '$p' },
  { pattern: /\bWebSquare\.net\b|\bWebSquare\/net\b/i, component: 'WebSquare/net' },
  { pattern: /\binputCalendar\b|인풋캘린더/i, component: 'inputCalendar' },
  { pattern: /\bautoComplete\b|자동완성/i, component: 'autoComplete' },
  { pattern: /\btabControl\b|탭컨트롤/i, component: 'tabControl' },
  { pattern: /\bwindowContainer\b|윈도우컨테이너|MDI/i, component: 'windowContainer' },
  { pattern: /\bscheduleCalendar\b|스케줄캘린더/i, component: 'scheduleCalendar' },
  { pattern: /\btextarea\b|textArea|텍스트에어리어/i, component: 'textarea' },
  { pattern: /\btextbox\b|textBox|텍스트박스/i, component: 'textbox' },
  { pattern: /\btrigger\b|버튼/i, component: 'trigger' },
];

const STOP_TERMS = new Set([
  'WebSquare', 'GridView', 'DataList', 'DataMap', 'String', 'Number',
  'Boolean', 'Object', 'Array', 'JSON', 'XML',
]);

function isEnabled(value) {
  if (value === true) return true;
  if (typeof value === 'string') return /^(1|true|yes|on)$/i.test(value);
  return false;
}

function getMcpConfig(options = {}) {
  const fullConfig = loadConfig();
  const config = {
    ...(fullConfig.mcp || {}),
    ...(options.mcp || {}),
  };

  const envEnabled = process.env.ENABLE_MCP_CONTEXT;
  if (envEnabled !== undefined) config.enabled = isEnabled(envEnabled);
  if (process.env.MCP_CONTEXT_PROVIDER) config.provider = process.env.MCP_CONTEXT_PROVIDER;
  if (process.env.MCP_CONTEXT_COMMAND) config.command = process.env.MCP_CONTEXT_COMMAND;
  if (process.env.MCP_CONTEXT_ENDPOINT) config.endpoint = process.env.MCP_CONTEXT_ENDPOINT;

  config.enabled = isEnabled(config.enabled);
  config.provider = config.provider || 'command';
  config.timeoutMs = Number(config.timeoutMs || DEFAULT_TIMEOUT_MS);
  config.maxItems = Number(config.maxItems || DEFAULT_MAX_ITEMS);
  return config;
}

function extractComponents(text) {
  const found = [];
  const seen = new Set();

  for (const alias of COMPONENT_ALIASES) {
    if (alias.pattern.test(text) && !seen.has(alias.component)) {
      seen.add(alias.component);
      found.push(alias.component);
    }
  }

  return found;
}

function extractSearchTerms(text) {
  const found = [];
  const seen = new Set();
  const patterns = [
    /\b([a-z][A-Za-z0-9_]{3,})\s*\(/g,
    /\b(inputType|expression|spanAll|showDepth|drilldown|displayFormatter|customFormatter|rowIndex|getRealRowIndex)\b/g,
    /inputType\s*=\s*["']?([a-zA-Z]+)["']?/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const term = match[1];
      if (!term || STOP_TERMS.has(term) || seen.has(term)) continue;
      seen.add(term);
      found.push(term);
    }
  }

  return found.slice(0, 8);
}

function buildQueries(question, ragCases, maxItems) {
  const ragText = Array.isArray(ragCases)
    ? ragCases.slice(0, 3).map((item) => [item.title, item.content].filter(Boolean).join('\n')).join('\n\n')
    : '';
  const text = [question, ragText].filter(Boolean).join('\n\n');
  const components = extractComponents(text);
  const searchTerms = extractSearchTerms(text);
  const queries = [];

  for (const component of components) {
    const term = searchTerms.find((item) => text.toLowerCase().includes(item.toLowerCase()));
    queries.push({ component, search: term || undefined });
  }

  if (queries.length === 0) {
    for (const term of searchTerms) {
      queries.push({ component: 'gridView', search: term });
    }
  }

  return queries.slice(0, maxItems);
}

function parseProviderResponse(output) {
  const text = String(output || '').trim();
  if (!text) return '';

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed.content)) {
      return parsed.content.map((item) => item.text || '').filter(Boolean).join('\n\n');
    }
    if (Array.isArray(parsed)) {
      return parsed.map((item) => item.text || item.content || '').filter(Boolean).join('\n\n');
    }
    return parsed.text || parsed.content || text;
  } catch {
    return text;
  }
}

function queryByCommand(config, request) {
  if (!config.command) {
    return { ok: false, error: 'MCP command is not configured.' };
  }

  const args = Array.isArray(config.args) ? [...config.args] : [];
  args.push(JSON.stringify(request));

  const output = execFileSync(config.command, args, {
    encoding: 'utf8',
    timeout: config.timeoutMs,
    env: { ...process.env },
  });

  return { ok: true, text: parseProviderResponse(output) };
}

async function queryByHttp(config, request) {
  if (!config.endpoint) {
    return { ok: false, error: 'MCP endpoint is not configured.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.headers || {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: `MCP HTTP ${response.status}` };
    }

    return { ok: true, text: parseProviderResponse(await response.text()) };
  } finally {
    clearTimeout(timer);
  }
}

async function queryMcp(config, query) {
  const request = {
    tool: 'get_component',
    arguments: {
      component: query.component,
      search: query.search,
    },
  };

  if (config.provider === 'http') {
    return queryByHttp(config, request);
  }

  return queryByCommand(config, request);
}

function formatContext(items) {
  if (!items.length) return '';

  const parts = items.map((item) => {
    const title = item.search
      ? `${item.component}.${item.search}`
      : item.component;
    return [
      `--- MCP 공식 스펙 [${title}] ---`,
      maskSensitiveInfo(item.text).slice(0, 2000),
    ].join('\n');
  });

  return ['## WebSquare MCP 공식 스펙', ...parts].join('\n\n');
}

async function buildMcpContext(question, ragCases = [], options = {}) {
  const config = getMcpConfig(options);
  if (!config.enabled) {
    return {
      enabled: false,
      available: false,
      context: '',
      items: [],
      errors: [],
      sources: [],
    };
  }

  const queries = buildQueries(question, ragCases, config.maxItems);
  if (queries.length === 0) {
    return {
      enabled: true,
      available: false,
      context: '',
      items: [],
      errors: ['No MCP lookup candidates found.'],
      sources: [],
    };
  }

  const items = [];
  const errors = [];

  for (const query of queries) {
    try {
      const result = await queryMcp(config, query);
      if (result.ok && result.text) {
        items.push({ ...query, text: result.text });
      } else if (result.error) {
        errors.push(result.error);
      }
    } catch (err) {
      errors.push(err.message);
    }
  }

  return {
    enabled: true,
    available: items.length > 0,
    context: formatContext(items),
    items: items.map(({ text, ...item }) => item),
    errors,
    sources: items.length > 0 ? ['MCP'] : [],
  };
}

module.exports = {
  buildMcpContext,
  buildQueries,
  extractComponents,
  extractSearchTerms,
};
