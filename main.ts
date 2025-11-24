/**
 * main.ts
 * Forest Mini 플러그인 진입점
 * - Mephisto 렌즈로 노트를 분석하는 옵시디언 플러그인
 * - Google Gemini API를 사용한 메타인지 분석
 */

import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ForestMiniSettings, DEFAULT_SETTINGS } from './src/settings';
import { GeminiClient } from './src/api/gemini';
import { LensView, LENS_VIEW_TYPE } from './src/views/LensView';

/**
 * Forest Mini 플러그인 메인 클래스
 */
export default class ForestMiniPlugin extends Plugin {
	settings: ForestMiniSettings;
	geminiClient: GeminiClient;

	/**
	 * 플러그인 로드 시 실행
	 */
	async onload() {
		console.log('Loading Forest Mini plugin');

		// 설정 로드
		await this.loadSettings();

		// Gemini 클라이언트 초기화
		this.geminiClient = new GeminiClient();
		if (this.settings.geminiApiKey) {
			try {
				this.geminiClient.initialize(this.settings.geminiApiKey);
			} catch (error) {
				console.error('Failed to initialize Gemini client:', error);
			}
		}

		// LensView 등록
		this.registerView(
			LENS_VIEW_TYPE,
			(leaf) => new LensView(leaf)
		);

		// 리본 아이콘 추가 (좌측 사이드바)
		this.addRibbonIcon('tree-deciduous', 'Forest Mini', async () => {
			// 클릭 시 LensView 활성화
			await this.activateLensView();
		});

		// "Analyze with Mephisto" 커맨드 추가
		this.addCommand({
			id: 'analyze-with-mephisto',
			name: 'Analyze with Mephisto',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.analyzeCurrentNote(editor, view);
			}
		});

		// 설정 탭 등록
		this.addSettingTab(new ForestMiniSettingTab(this.app, this));
	}

	/**
	 * 플러그인 언로드 시 실행
	 */
	onunload() {
		console.log('Unloading Forest Mini plugin');

		// LensView 정리
		this.app.workspace.detachLeavesOfType(LENS_VIEW_TYPE);
	}

	/**
	 * 설정 로드
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * 설정 저장
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * LensView 활성화 (우측 사이드바에 열기)
	 */
	async activateLensView() {
		const { workspace } = this.app;

		// 기존 LensView가 있는지 확인
		let leaf = workspace.getLeavesOfType(LENS_VIEW_TYPE)[0];

		if (!leaf) {
			// 없으면 우측 사이드바에 새로 생성
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: LENS_VIEW_TYPE,
					active: true
				});
				leaf = rightLeaf;
			}
		}

		// LensView로 포커스
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * 현재 노트를 Mephisto 렌즈로 분석
	 */
	async analyzeCurrentNote(editor: Editor, view: MarkdownView) {
		// API 키 확인
		if (!this.settings.geminiApiKey) {
			new Notice('Please set your Gemini API key in settings first.');
			return;
		}

		// Gemini 클라이언트 초기화 확인
		if (!this.geminiClient.isInitialized()) {
			try {
				this.geminiClient.initialize(this.settings.geminiApiKey);
			} catch (error) {
				new Notice('Failed to initialize Gemini client. Check your API key.');
				return;
			}
		}

		// LensView 열기
		await this.activateLensView();

		// LensView 인스턴스 가져오기
		const lensView = this.app.workspace.getLeavesOfType(LENS_VIEW_TYPE)[0]?.view as LensView;
		if (!lensView) {
			new Notice('Failed to open Lens View');
			return;
		}

		// 로딩 상태 표시
		lensView.showLoading();
		new Notice('Analyzing with Mephisto...');

		try {
			// 현재 노트 내용 가져오기
			const noteContent = editor.getValue();

			if (!noteContent || noteContent.trim() === '') {
				lensView.showError('Current note is empty');
				new Notice('Current note is empty');
				return;
			}

			// Gemini API로 분석
			const analysis = await this.geminiClient.analyzeNote(
				this.settings.mephistoPrompt,
				noteContent
			);

			// 결과 표시
			await lensView.showAnalysis(analysis);
			new Notice('Analysis complete!');

		} catch (error) {
			console.error('Analysis error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			lensView.showError(errorMessage);
			new Notice(`Analysis failed: ${errorMessage}`);
		}
	}
}

/**
 * 플러그인 설정 탭
 */
class ForestMiniSettingTab extends PluginSettingTab {
	plugin: ForestMiniPlugin;

	constructor(app: App, plugin: ForestMiniPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 헤더
		containerEl.createEl('h2', { text: 'Forest Mini Settings' });

		// Google Gemini API 키 설정
		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Enter your Google Gemini API key. Get it from https://makersuite.google.com/app/apikey')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.geminiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();

					// API 키가 변경되면 클라이언트 재초기화
					if (value) {
						try {
							this.plugin.geminiClient.initialize(value);
							new Notice('API key saved and client initialized');
						} catch (error) {
							new Notice('Invalid API key');
						}
					}
				}));

		// Mephisto 프롬프트 설정
		new Setting(containerEl)
			.setName('Mephisto System Prompt')
			.setDesc('Customize the Mephisto analysis prompt (advanced)')
			.addTextArea(text => text
				.setPlaceholder('Enter system prompt')
				.setValue(this.plugin.settings.mephistoPrompt)
				.onChange(async (value) => {
					this.plugin.settings.mephistoPrompt = value;
					await this.plugin.saveSettings();
				}))
			.then(setting => {
				// 텍스트 영역 크기 조정
				const textArea = setting.controlEl.querySelector('textarea');
				if (textArea) {
					textArea.rows = 10;
					textArea.style.width = '100%';
				}
			});
	}
}
