export class AudioProcessor {
	private audioContext: AudioContext | null = null
	private workletNode: AudioWorkletNode | null = null
	private sourceNode: MediaStreamAudioSourceNode | null = null
	private destinationNode: MediaStreamAudioDestinationNode | null = null
	private noiseSuppressionLevel: number = 0.5
	private config: any

	constructor(config: any = {}) {
		this.config = config
		this.noiseSuppressionLevel = config.defaultLevel || 0.5
	}

	async initialize() {
		this.audioContext = new AudioContext()

		// Загружаем кастомный AudioWorklet
		await this.audioContext.audioWorklet.addModule(
			'/effects-integration/worklets/adjustable-noise-suppressor.js'
		)
	}

	async process(stream: MediaStream): Promise<MediaStream> {
		if (!this.audioContext) {
			await this.initialize()
		}

		// Создаем граф обработки
		this.sourceNode = this.audioContext!.createMediaStreamSource(stream)
		this.destinationNode = this.audioContext!.createMediaStreamDestination()

		// Создаем AudioWorklet с параметром уровня
		this.workletNode = new AudioWorkletNode(
			this.audioContext!,
			'AdjustableNoiseSuppressor',
			{
				parameterData: {
					suppressionLevel: this.noiseSuppressionLevel,
				},
			}
		)

		// Подключаем: источник → worklet → выход
		this.sourceNode.connect(this.workletNode)
		this.workletNode.connect(this.destinationNode)

		// Возвращаем обработанный поток
		return this.destinationNode.stream
	}

	// Изменение уровня шумоподавления на лету
	async setNoiseSuppressionLevel(level: number) {
		this.noiseSuppressionLevel = Math.max(0, Math.min(1, level))

		if (this.workletNode) {
			// Отправляем сообщение в worklet
			this.workletNode.port.postMessage({
				type: 'updateSuppressionLevel',
				level: this.noiseSuppressionLevel,
			})
		}
	}

	cleanup() {
		this.workletNode?.disconnect()
		this.sourceNode?.disconnect()
		this.audioContext?.close()
	}
}
