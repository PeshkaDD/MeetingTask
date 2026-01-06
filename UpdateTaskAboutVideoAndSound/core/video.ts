export class VideoProcessor {
	private config: any
	private canvas: HTMLCanvasElement | null = null
	private context: CanvasRenderingContext2D | null = null
	private videoElement: HTMLVideoElement | null = null
	private animationFrameId: number | null = null
	private processedStream: MediaStream | null = null

	constructor(config: any = {}) {
		this.config = config
	}

	async initialize(): Promise<void> {
		console.log('VideoProcessor initialized')
	}

	/**
	 * @param stream Исходный видео поток
	 * @returns Обработанный видео поток
	 */
	async process(stream: MediaStream): Promise<MediaStream> {
		if (this.processedStream) {
			return this.processedStream
		}

		this.canvas = document.createElement('canvas')
		this.context = this.canvas.getContext('2d')

		if (!this.context) {
			throw new Error('Failed to get canvas context')
		}

		this.videoElement = document.createElement('video')
		this.videoElement.srcObject = stream
		this.videoElement.muted = true
		this.videoElement.playsInline = true

		await new Promise((resolve) => {
			this.videoElement!.onloadedmetadata = () => {
				this.videoElement!.play()
				resolve(null)
			}
		})

		this.canvas.width = this.videoElement.videoWidth
		this.canvas.height = this.videoElement.videoHeight

		const originalTrack = stream.getVideoTracks()[0]

		this.processedStream = this.canvas.captureStream()
		const processedTrack = this.processedStream.getVideoTracks()[0]

		this.startProcessing()

		originalTrack.addEventListener('ended', () => {
			this.stopProcessing()
			processedTrack.stop()
		})

		return this.processedStream
	}

	private startProcessing(): void {
		if (!this.videoElement || !this.context || !this.canvas) {
			return
		}

		const processFrame = () => {
			if (this.videoElement!.readyState >= 2) {
				this.context!.drawImage(
					this.videoElement!,
					0,
					0,
					this.canvas!.width,
					this.canvas!.height
				)
			}

			this.animationFrameId = requestAnimationFrame(processFrame)
		}

		processFrame()
	}

	private applyEffects(): void {
		if (!this.context) return

		const imageData = this.context.getImageData(
			0,
			0,
			this.canvas!.width,
			this.canvas!.height
		)
		const data = imageData.data

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i]
			const g = data[i + 1]
			const b = data[i + 2]

			data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
			data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
			data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
		}

		this.context.putImageData(imageData, 0, 0)
	}

	/**
	 * @param blurAmount
	 */
	async applyBackgroundBlur(blurAmount: number = 10): Promise<void> {
		console.log(`Background blur applied with amount: ${blurAmount}`)

		if (this.canvas) {
			this.canvas.style.filter = `blur(${blurAmount}px)`
		}
	}

	/**

	 * @param backgroundUrl 
	 */
	async applyVirtualBackground(backgroundUrl: string): Promise<void> {
		console.log(`Virtual background applied: ${backgroundUrl}`)
	}

	stopProcessing(): void {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId)
			this.animationFrameId = null
		}

		if (this.videoElement) {
			this.videoElement.pause()
			this.videoElement.srcObject = null
			this.videoElement = null
		}

		this.processedStream = null
	}

	cleanup(): void {
		this.stopProcessing()

		if (this.canvas) {
			this.canvas.remove()
			this.canvas = null
		}

		this.context = null
	}
}
