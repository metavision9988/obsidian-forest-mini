/**
 * LensView.ts
 * Mephisto 렌즈 분석 결과를 표시하는 사이드바 뷰
 * - 우측 사이드바에 분석 결과 표시
 * - 마크다운 렌더링 지원
 */

import { ItemView, WorkspaceLeaf, MarkdownRenderer } from 'obsidian';

/** 뷰 타입 식별자 */
export const LENS_VIEW_TYPE = 'forest-mini-lens-view';

/**
 * Mephisto 렌즈 분석 결과 뷰
 */
export class LensView extends ItemView {
	private contentEl: HTMLElement;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	/**
	 * 뷰 타입 반환
	 */
	getViewType(): string {
		return LENS_VIEW_TYPE;
	}

	/**
	 * 뷰 디스플레이 텍스트 (탭 제목)
	 */
	getDisplayText(): string {
		return 'Mephisto Lens';
	}

	/**
	 * 뷰 아이콘
	 */
	getIcon(): string {
		return 'flame';
	}

	/**
	 * 뷰 열릴 때 초기화
	 */
	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('forest-mini-lens-view');

		// 헤더
		const header = container.createEl('div', { cls: 'forest-mini-header' });
		header.createEl('h3', { text: '🔥 Mephisto Analysis' });

		// 내용 컨테이너
		this.contentEl = container.createEl('div', { cls: 'forest-mini-content' });

		// 초기 안내 메시지
		this.showWelcomeMessage();
	}

	/**
	 * 환영 메시지 표시
	 */
	private showWelcomeMessage(): void {
		this.contentEl.empty();
		this.contentEl.createEl('p', {
			text: 'Select a note and use "Analyze with Mephisto" command to see analysis results here.',
			cls: 'forest-mini-welcome'
		});
	}

	/**
	 * 로딩 상태 표시
	 */
	showLoading(): void {
		this.contentEl.empty();
		const loadingEl = this.contentEl.createEl('div', { cls: 'forest-mini-loading' });
		loadingEl.createEl('p', { text: '🤔 Mephisto is analyzing...' });
	}

	/**
	 * 분석 결과 표시 (마크다운 렌더링)
	 * @param analysisText - AI 분석 결과 텍스트
	 */
	async showAnalysis(analysisText: string): Promise<void> {
		this.contentEl.empty();

		// 분석 날짜/시간 표시
		const timestamp = this.contentEl.createEl('div', { cls: 'forest-mini-timestamp' });
		timestamp.createEl('small', {
			text: `Analysis: ${new Date().toLocaleString()}`
		});

		// 분석 결과 (마크다운 렌더링)
		const resultEl = this.contentEl.createEl('div', { cls: 'forest-mini-result' });

		// Obsidian의 MarkdownRenderer를 사용하여 마크다운 렌더링
		await MarkdownRenderer.render(
			this.app,
			analysisText,
			resultEl,
			'', // sourcePath
			this
		);
	}

	/**
	 * 에러 메시지 표시
	 * @param errorMessage - 에러 메시지
	 */
	showError(errorMessage: string): void {
		this.contentEl.empty();
		const errorEl = this.contentEl.createEl('div', { cls: 'forest-mini-error' });
		errorEl.createEl('p', { text: '⚠️ Error' });
		errorEl.createEl('p', { text: errorMessage });
	}

	/**
	 * 뷰 닫힐 때 정리
	 */
	async onClose(): Promise<void> {
		// 정리 작업 (필요시)
	}
}
