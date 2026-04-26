export default async function handler(req, res) {
  const today = new Date().toLocaleDateString('ko-KR');

  const prompt = `오늘(${today}) 기준 한국 투자자에게 중요한 금융·경제·정책 뉴스 8개를 웹 검색해서 수집해줘.
반드시 JSON 배열만 반환. 설명, 마크다운, 코드블록 없이 순수 JSON만:
[{"date":"${today}","category":"policy 또는 market 또는 global 또는 real_estate 중 하나","title":"뉴스 제목 20자 내외","summary":"핵심 내용 1~2문장, 숫자 포함","tags":["키워드1","키워드2","투자시사점"],"urgent":false}]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');

    // JSON 파싱
    const match = textBlocks.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error('뉴스 JSON을 찾을 수 없습니다.');

    const news = JSON.parse(match[0]);
    res.status(200).json({ news, updatedAt: new Date().toISOString() });

  } catch (e) {
    console.error('News API error:', e);
    res.status(500).json({ error: e.message });
  }
}
