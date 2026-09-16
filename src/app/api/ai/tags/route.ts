import { NextResponse } from 'next/server'
import { GeminiRequestError, generateGeminiText } from '@/lib/gemini'

const MAX_TAGS = 5

interface TagsRequest {
  title?: string
  content?: string
  existingTags?: unknown
}

function uniqueTags(values: unknown[]): string[] {
  const unique: string[] = []
  const seen = new Set<string>()

  for (const item of values) {
    if (typeof item !== 'string') continue
    const tag = item.trim().replace(/^#/, '')
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    unique.push(tag)
  }

  return unique
}

function parseTags(text: string, limit: number): string[] {
  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    parsed = cleaned
      .split(/[\n,]/)
      .map(item => item.replace(/^[-*#\d.]+\s*/, '').replace(/^["']|["']$/g, '').trim())
      .filter(Boolean)
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return uniqueTags(parsed).slice(0, Math.max(0, limit))
}

export async function POST(request: Request) {
  let body: TagsRequest

  try {
    body = (await request.json()) as TagsRequest
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const title = body.title?.trim() ?? ''
  const content = body.content?.trim() ?? ''
  const existingTags = uniqueTags(
    Array.isArray(body.existingTags) ? body.existingTags : []
  )
  const remaining = MAX_TAGS - existingTags.length

  if (!title || !content) {
    return NextResponse.json(
      { error: '제목과 내용이 필요합니다.' },
      { status: 400 }
    )
  }

  if (remaining <= 0) {
    return NextResponse.json({ tags: [] })
  }

  const prompt = [
    '다음 메모에 달 태그를 JSON 문자열 배열로만 출력하세요.',
    `최대 ${remaining}개, 짧은 한국어 단어, 중복 없이.`,
    existingTags.length > 0
      ? `기존 태그와 겹치지 마세요: ${JSON.stringify(existingTags)}`
      : '',
    '다른 설명, 마크다운, 코드펜스는 넣지 마세요.',
    '예: ["회의","프로젝트"]',
    '',
    `제목: ${title}`,
    `내용: ${content}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const raw = await generateGeminiText(prompt)
    const existingKeys = new Set(existingTags.map(tag => tag.toLowerCase()))
    const tags = parseTags(raw, remaining).filter(
      tag => !existingKeys.has(tag.toLowerCase())
    )

    return NextResponse.json({ tags })
  } catch (error) {
    if (error instanceof GeminiRequestError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'AI 요청에 실패했습니다.' }, { status: 500 })
  }
}
