import { AudioProcessor } from './audio'
import { VideoProcessor } from './video'

export class EffectsManager {
	private audioProcessor: AudioProcessor
	private videoProcessor: VideoProcessor
	private activeEffects: Map<string, any> = new Map()

	constructor(config: any = {}) {
		this.audioProcessor = new AudioProcessor(config.audio)
		this.videoProcessor = new VideoProcessor(config.video)
	}

	// Остальной код без изменений
	async initialize() {
		await Promise.all([
			this.audioProcessor.initialize(),
			this.videoProcessor.initialize(),
		])
	}

	async processStream(
		stream: MediaStream,
		constraints: MediaStreamConstraints | undefined
	): Promise<MediaStream> {
		let processedStream = stream

		if (constraints?.audio) {
			processedStream = await this.audioProcessor.process(processedStream)
		}

		// Обработка видео
		if (constraints?.video) {
			processedStream = await this.videoProcessor.process(processedStream)
		}

		return processedStream
	}

	async setNoiseSuppression(level: number) {
		await this.audioProcessor.setNoiseSuppressionLevel(level)
		this.activeEffects.set('noiseSuppression', { level })
	}

	hasActiveEffects(): boolean {
		return this.activeEffects.size > 0
	}

	getActiveEffects() {
		return Array.from(this.activeEffects.entries())
	}
}
