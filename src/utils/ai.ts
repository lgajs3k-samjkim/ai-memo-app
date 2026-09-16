export const MAX_TAGS = 5

interface AiErrorResponse {
  error?: string
}

interface SummarizeResponse extends AiErrorResponse {
  summary?: string
}

interface TagsResponse extends AiErrorResponse {
  tags?: string[]
}

async function postJson<T extends AiErrorResponse>(
  url: string,
  body: { title: string; content: string; existingTags?: string[] }
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data: T
  try {
    data = (await response.json()) as T
  } catch {
    throw new Error('AI 응답을 처리하지 못했습니다.')
  }

  if (!response.ok) {
    throw new Error(data.error || 'AI 요청에 실패했습니다.')
  }

  return data
}

export async function summarizeMemo(
  title: string,
  content: string
): Promise<string> {
  const data = await postJson<SummarizeResponse>('/api/ai/summarize', {
    title,
    content,
  })

  if (!data.summary?.trim()) {
    throw new Error('요약을 만들지 못했습니다.')
  }

  return data.summary.trim()
}

export async function suggestMemoTags(
  title: string,
  content: string,
  existingTags: string[] = []
): Promise<string[]> {
  const data = await postJson<TagsResponse>('/api/ai/tags', {
    title,
    content,
    existingTags,
  })

  return Array.isArray(data.tags) ? data.tags : []
}

export function mergeTags(existing: string[], suggested: string[]): string[] {
  const merged = [...existing]
  const seen = new Set(existing.map(tag => tag.toLowerCase()))

  for (const tag of suggested) {
    if (merged.length >= MAX_TAGS) break
    const next = tag.trim().replace(/^#/, '')
    const key = next.toLowerCase()
    if (!next || seen.has(key)) continue
    seen.add(key)
    merged.push(next)
  }

  return merged
}
