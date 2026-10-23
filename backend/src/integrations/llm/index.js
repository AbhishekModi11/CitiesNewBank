import { config } from '../../config.js'

export function createLLM(configOverride = config) {
  const provider = configOverride.llmProvider
  const apiKey = configOverride.llmApiKey
  async function chatAnthropic(messages, system) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 512,
        system,
        messages,
      }),
    })
    if (!res.ok) throw new Error(`anthropic ${res.status}`)
    const json = await res.json()
    return json.content?.map((c) => c.text).join('') || ''
  }
  async function chatOpenAI(messages, system) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: 512,
      }),
    })
    if (!res.ok) throw new Error(`openai ${res.status}`)
    const json = await res.json()
    return json.choices?.[0]?.message?.content || ''
  }
  return {
    provider,
    async chat(messages, system) {
      if (provider === 'anthropic' && apiKey) return chatAnthropic(messages, system)
      if (provider === 'openai' && apiKey) return chatOpenAI(messages, system)
      return null
    },
  }
}

