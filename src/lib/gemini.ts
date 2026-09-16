const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

interface GeminiPart {
  text?: string
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[]
    }
  }>
  error?: {
    message?: string
  }
}

export class GeminiRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeminiRequestError'
  }
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiRequestError('AI 서비스를 사용할 수 없습니다.')
  }
  return apiKey
}

export async function generateGeminiText(prompt: string): Promise<string> {
  const apiKey = getApiKey()

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  })

  let data: GeminiResponse
  try {
    data = (await response.json()) as GeminiResponse
  } catch {
    throw new GeminiRequestError('AI 응답을 처리하지 못했습니다.')
  }

  if (!response.ok) {
    throw new GeminiRequestError('AI 요청에 실패했습니다.')
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map(part => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new GeminiRequestError('AI 응답이 비어 있습니다.')
  }

  return text
}
