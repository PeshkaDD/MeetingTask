import { EffectsManager } from './effects'

let effectsManager: EffectsManager | null = null

export function initializeEffectsSDK(config: { apiKey?: string } = {}) {
	if (effectsManager) return effectsManager

	effectsManager = new EffectsManager(config)
	interceptMediaStreams()

	console.log('🎵 Effects SDK initialized successfully!')
	return effectsManager
}

export function getEffectsManager() {
	if (!effectsManager) {
		throw new Error(
			'Effects SDK not initialized. Call initializeEffectsSDK() first.'
		)
	}
	return effectsManager
}

function interceptMediaStreams() {
	const originalGetUserMedia = navigator.mediaDevices.getUserMedia

	navigator.mediaDevices.getUserMedia = async function (constraints) {
		const originalStream = await originalGetUserMedia.call(this, constraints)

		if (effectsManager && effectsManager.hasActiveEffects()) {
			// ПРАВИЛЬНО: передаем constraints, который точно определен здесь
			return await effectsManager.processStream(originalStream, constraints)
		}

		return originalStream
	}
}
