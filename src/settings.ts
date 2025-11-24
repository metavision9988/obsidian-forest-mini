/**
 * settings.ts
 * 플러그인 설정 인터페이스 및 기본값 정의
 * - Gemini API 키 저장
 * - 향후 추가 설정 옵션 확장 가능
 */

/**
 * 플러그인 설정 인터페이스
 */
export interface ForestMiniSettings {
	/** Google Gemini API 키 */
	geminiApiKey: string;

	/** Mephisto 렌즈 시스템 프롬프트 (향후 커스터마이징 가능) */
	mephistoPrompt: string;
}

/**
 * 기본 설정 값
 */
export const DEFAULT_SETTINGS: ForestMiniSettings = {
	geminiApiKey: '',
	mephistoPrompt: `You are Mephisto, a ruthlessly honest critic and meta-cognitive analyst.
Your role is to analyze the user's note with brutal honesty and provide insights on:
- Logic flaws and weak reasoning
- Unexamined assumptions
- Missing perspectives
- Cognitive biases
- Areas requiring deeper thinking

Be direct, critical, and constructive. Focus on improving the quality of thinking.`
}
