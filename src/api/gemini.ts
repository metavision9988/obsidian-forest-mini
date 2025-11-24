/**
 * gemini.ts
 * Google Gemini API 클라이언트
 * - Gemini 1.5 Flash 모델을 사용하여 노트 분석
 * - 시스템 프롬프트와 사용자 노트를 결합하여 AI 분석 수행
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Notice } from 'obsidian';

/**
 * Gemini API 클라이언트 클래스
 */
export class GeminiClient {
	private genAI: GoogleGenerativeAI | null = null;
	private model: any = null;

	/**
	 * API 키로 클라이언트 초기화
	 * @param apiKey - Google Gemini API 키
	 */
	initialize(apiKey: string): void {
		if (!apiKey || apiKey.trim() === '') {
			throw new Error('API key is required');
		}

		this.genAI = new GoogleGenerativeAI(apiKey);
		// Gemini 1.5 Flash 모델 사용
		this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
	}

	/**
	 * 노트 내용을 Mephisto 렌즈로 분석
	 * @param systemPrompt - Mephisto 시스템 프롬프트
	 * @param noteContent - 분석할 노트 내용
	 * @returns AI 분석 결과
	 */
	async analyzeNote(systemPrompt: string, noteContent: string): Promise<string> {
		if (!this.model) {
			throw new Error('Gemini client not initialized. Please set your API key in settings.');
		}

		if (!noteContent || noteContent.trim() === '') {
			throw new Error('Note content is empty');
		}

		try {
			// 시스템 프롬프트와 노트 내용을 결합
			const fullPrompt = `${systemPrompt}\n\n---\n\nAnalyze the following note:\n\n${noteContent}`;

			// API 호출
			const result = await this.model.generateContent(fullPrompt);
			const response = await result.response;
			const text = response.text();

			if (!text) {
				throw new Error('Empty response from Gemini API');
			}

			return text;

		} catch (error) {
			console.error('Gemini API error:', error);

			// 에러 타입에 따른 사용자 친화적 메시지
			if (error instanceof Error) {
				if (error.message.includes('API_KEY_INVALID')) {
					throw new Error('Invalid API key. Please check your settings.');
				} else if (error.message.includes('QUOTA_EXCEEDED')) {
					throw new Error('API quota exceeded. Please try again later.');
				}
				throw new Error(`Analysis failed: ${error.message}`);
			}

			throw new Error('Unknown error occurred during analysis');
		}
	}

	/**
	 * 클라이언트 초기화 여부 확인
	 */
	isInitialized(): boolean {
		return this.model !== null;
	}
}
