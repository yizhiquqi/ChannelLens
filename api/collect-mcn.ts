type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

function asText(value: unknown) {
  return String(value ?? '').trim();
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function pickCompany(text: string) {
  const matches = text.match(/[\u4e00-\u9fa5A-Za-z0-9（）()]{2,45}(?:集团有限公司|控股有限公司|文化传媒有限公司|网络科技有限公司|传媒科技有限公司|科技有限公司|有限公司)/g);
  return matches?.[0] ?? '';
}

function pickCapital(text: string) {
  return text.match(/注册资本[:：\s]*([0-9.]+(?:万|亿)?(?:人民币|元)?)/)?.[1] ?? '';
}

function pickFoundedDate(text: string) {
  return text.match(/(?:成立日期|成立时间|成立于)[:：\s]*(\d{4}[-年]\d{1,2}[-月]\d{1,2}日?|\d{4}年?)/)?.[1] ?? '';
}

function pickValue(text: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(`${escaped}[:：\\s]*([^\\n。；;]{1,120})`));
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function pickContacts(text: string) {
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const phones = text.match(/(?:1[3-9]\d{9}|0\d{2,3}[-\s]?\d{7,8}|400[-\s]?\d{3}[-\s]?\d{4})/g) ?? [];
  return unique([...emails, ...phones]);
}

function classifyResult(result: SearchResult) {
  const haystack = `${result.title} ${result.url} ${result.snippet}`;
  return {
    isWebsite: /官网|官方网站|\.com|\.cn|\.com\.cn/i.test(haystack) && !/企查|企信|天眼|爱企查|企查查/.test(haystack),
    isDouyin: /抖音|douyin\.com/.test(haystack),
    isXiaohongshu: /小红书|xiaohongshu\.com|xhslink/.test(haystack),
    isWechat: /微信公众号|微信公众平台|mp\.weixin\.qq\.com/.test(haystack),
    isNews: /新闻|资讯|报道|融资|处罚|诉讼|纠纷|回应/.test(haystack),
  };
}

async function bingSearch(query: string): Promise<SearchResult[]> {
  const key = process.env.BING_SEARCH_API_KEY;
  if (!key) return [];

  const url = new URL('https://api.bing.microsoft.com/v7.0/search');
  url.searchParams.set('q', query);
  url.searchParams.set('mkt', 'zh-CN');
  url.searchParams.set('count', '8');

  const response = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': key },
  });

  if (!response.ok) throw new Error(`Bing search failed: ${response.status}`);
  const data = await response.json();
  const values = Array.isArray(data?.webPages?.value) ? data.webPages.value : [];
  return values.map((item: Record<string, unknown>) => ({
    title: asText(item.name),
    url: asText(item.url),
    snippet: asText(item.snippet),
  }));
}

async function serperSearch(query: string): Promise<SearchResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl: 'cn',
      hl: 'zh-cn',
      num: 10,
    }),
  });

  if (!response.ok) throw new Error(`Serper search failed: ${response.status}`);
  const data = await response.json();
  const values = Array.isArray(data?.organic) ? data.organic : [];
  return values.map((item: Record<string, unknown>) => ({
    title: asText(item.title),
    url: asText(item.link),
    snippet: asText(item.snippet),
  }));
}

async function serpApiSearch(query: string): Promise<SearchResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return [];

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('hl', 'zh-cn');
  url.searchParams.set('num', '8');
  url.searchParams.set('api_key', key);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SerpApi search failed: ${response.status}`);
  const data = await response.json();
  const values = Array.isArray(data?.organic_results) ? data.organic_results : [];
  return values.map((item: Record<string, unknown>) => ({
    title: asText(item.title),
    url: asText(item.link),
    snippet: asText(item.snippet),
  }));
}

async function runSearch(query: string) {
  if (process.env.SERPER_API_KEY) return serperSearch(query);
  if (process.env.SERPAPI_KEY) return serpApiSearch(query);
  if (process.env.BING_SEARCH_API_KEY) return bingSearch(query);
  return [] as SearchResult[];
}

export default async function handler(req: any, res: any) {
  const name = asText(req.query?.name);
  if (!name) {
    res.status(400).json({ error: 'Missing name' });
    return;
  }

  const queries = [
    `${name} 官网 公司介绍`,
    `${name} 公司主体 注册资本 成立时间`,
    `${name} 抖音 账号`,
    `${name} 小红书 账号`,
    `${name} 微信公众号`,
    `${name} 新闻 合作 争议`,
  ];

  try {
    const resultGroups = await Promise.all(queries.map((query) => runSearch(query)));
    const sources = unique(resultGroups.flat().map((item) => JSON.stringify(item))).map((item) => JSON.parse(item) as SearchResult);
    const combinedText = sources.map((source) => `${source.title} ${source.snippet}`).join('\n');
    const classified = sources.map((source) => ({ source, flags: classifyResult(source) }));
    const website = classified.find((item) => item.flags.isWebsite)?.source.url ?? '';
    const douyin = classified.find((item) => item.flags.isDouyin)?.source.url ?? '';
    const xiaohongshu = classified.find((item) => item.flags.isXiaohongshu)?.source.url ?? '';
    const wechat = classified.find((item) => item.flags.isWechat)?.source.url ?? '';
    const news = classified.filter((item) => item.flags.isNews).slice(0, 6).map((item) => item.source);

    res.status(200).json({
      name,
      company: pickCompany(combinedText),
      formerName: pickValue(combinedText, ['曾用名']),
      companyType: pickValue(combinedText, ['企业类型', '公司类型']),
      industry: pickValue(combinedText, ['所属行业', '行业']),
      website,
      foundedDate: pickFoundedDate(combinedText),
      registeredCapital: pickCapital(combinedText),
      legalRepresentative: pickValue(combinedText, ['法定代表人', '法人代表', '法人']),
      businessStatus: pickValue(combinedText, ['经营状态', '登记状态']),
      registrationAuthority: pickValue(combinedText, ['登记机关']),
      approvalDate: pickValue(combinedText, ['核准日期']),
      insuredCount: pickValue(combinedText, ['参保人数']),
      staffSize: pickValue(combinedText, ['人员规模']),
      unifiedSocialCreditCode: pickValue(combinedText, ['统一社会信用代码']),
      taxpayerId: pickValue(combinedText, ['纳税人识别号']),
      registrationNumber: pickValue(combinedText, ['注册号']),
      organizationCode: pickValue(combinedText, ['组织机构代码']),
      address: pickValue(combinedText, ['地址', '注册地址', '住所']),
      businessScope: pickValue(combinedText, ['经营范围']),
      douyinAccount: douyin,
      xiaohongshuAccount: xiaohongshu,
      wechatOfficialAccount: wechat,
      publicContacts: pickContacts(combinedText),
      news,
      sources: sources.slice(0, 24),
      status: sources.length > 0 ? 'draft_from_search' : 'needs_search_api_key',
      searchProvider: process.env.SERPER_API_KEY ? 'serper' : process.env.SERPAPI_KEY ? 'serpapi' : process.env.BING_SEARCH_API_KEY ? 'bing' : 'none',
      searchLinks: queries.map((query) => ({
        label: query,
        url: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
      })),
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Collector failed',
      name,
      status: 'collector_error',
    });
  }
}
