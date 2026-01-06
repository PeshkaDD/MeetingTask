export const CONFIG = {
	apiKey: process.env.EFFECTS_SDK_API_KEY || '',
	effects: {
		audio: {
			noiseSuppression: {
				enabled: true,
				defaultLevel: 0.7,
			},
		},
	},
}
