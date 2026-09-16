import { NextResponse } from 'next/server'
import { GeminiRequestError, generateGeminiText } from '@/lib/gemini'

const MAX_SUMMARY_LENGTH = 200

interface SummarizeRequest {
  title?: string
  content?: string
}

export async function POST(request: Request) {
  let body: SummarizeRequest

  try {
    body = (await request.json()) as SummarizeRequest
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const title = body.title?.trim() ?? ''
  const content = body.content?.trim() ?? ''

  if (!title || !content) {
    return NextResponse.json(
      { error: '제목과 내용이 필요합니다.' },
      { status: 400 }
    )
  }

  const prompt = [
    '다음 메모를 한국어로 요약하세요.',
    '200자 이내의 평문만 출력하세요.',
    '마크다운, 따옴표, 제목, 접두어는 사용하지 마세요.',
    '',
    `제목: ${title}`,
    `내용: ${content}`,
  ].join('\n')

  try {
    const rawSummary = await generateGeminiText(prompt)
    const summary = rawSummary.replace(/^["'\s]+|["'\s]+$/g, '').slice(0, MAX_SUMMARY_LENGTH)

    return NextResponse.json({ summary })
  } catch (error) {
    if (error instanceof GeminiRequestError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'AI 요청에 실패했습니다.' }, { status: 500 })
  }
}
