export class AudioProcessor {
	private audioContext: AudioContext | null = null
	private workletNode: AudioWorkletNode | null = null
	private sourceNode: MediaStreamAudioSourceNode | null = null
	private destinationNode: MediaStreamAudioDestinationNode | null = null
	private noiseSuppressionLevel: number = 0.5
	private currentStream: MediaStream | null = null

	async initialize() {
		if (this.audioContext?.state !== 'closed') {
			this.audioContext = new AudioContext()
		}

		try {
			await this.audioContext.audioWorklet.addModule(
				'/effects-integration/worklets/adjustable-noise-suppressor.js'
			)
		} catch (error) {
			console.error('Failed to load AudioWorklet:', error)
			throw error
		}
	}

	async process(stream: MediaStream): Promise<MediaStream> {
		if (this.currentStream === stream && this.destinationNode) {
			return this.destinationNode.stream
		}

		this.currentStream = stream

		if (!this.audioContext || this.audioContext.state === 'closed') {
			await this.initialize()
		}

		this.cleanup()

		this.sourceNode = this.audioContext!.createMediaStreamSource(stream)
		this.destinationNode = this.audioContext!.createMediaStreamDestination()

		this.workletNode = new AudioWorkletNode(
			this.audioContext!,
			'AdjustableNoiseSuppressor',
			{
				parameterData: {
					suppressionLevel: this.noiseSuppressionLevel,
				},
				outputChannelCount: [1],
			}
		)

		this.sourceNode.connect(this.workletNode)
		this.workletNode.connect(this.destinationNode)

		return this.destinationNode.stream
	}

	async setNoiseSuppressionLevel(level: number) {
		this.noiseSuppressionLevel = Math.max(0, Math.min(1, level))

		if (this.workletNode) {
			this.workletNode.port.postMessage({
				type: 'updateSuppressionLevel',
				level: this.noiseSuppressionLevel,
			})

			const param = this.workletNode.parameters.get('suppressionLevel')
			if (param) {
				param.value = this.noiseSuppressionLevel
			}
		}
	}

	cleanup() {
		this.workletNode?.disconnect()
		this.sourceNode?.disconnect()
	}

	async close() {
		this.cleanup()
		await this.audioContext?.close()
	}
}
