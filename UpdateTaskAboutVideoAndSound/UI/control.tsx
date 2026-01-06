import React, { useEffect, useState } from 'react'
import { getEffectsManager } from '../core/index'

interface EffectsControlsProps {
	className?: string
}

export const EffectsControls: React.FC<EffectsControlsProps> = ({
	className,
}) => {
	const [noiseSuppressionLevel, setNoiseSuppressionLevel] = useState(0.5)
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		const init = async () => {
			try {
				await getEffectsManager().initialize()
				setIsInitialized(true)
			} catch (error) {
				console.error('Failed to initialize Effects SDK:', error)
			}
		}

		init()
	}, [])

	const handleNoiseSuppressionChange = async (level: number) => {
		setNoiseSuppressionLevel(level)

		if (isInitialized) {
			await getEffectsManager().setNoiseSuppression(level)
		}
	}

	if (!isInitialized) {
		return <div className={className}>Loading effects...</div>
	}

	return (
		<div className={`effects-controls ${className || ''}`}>
			<div className="control-group">
				<label className="control-label">
					Noise Suppression: {Math.round(noiseSuppressionLevel * 100)}%
				</label>
				<input
					type="range"
					min="0"
					max="1"
					step="0.1"
					value={noiseSuppressionLevel}
					onChange={(e) =>
						handleNoiseSuppressionChange(parseFloat(e.target.value))
					}
					className="control-slider"
				/>
				<div className="slider-ticks">
					<span>Off</span>
					<span>Low</span>
					<span>Medium</span>
					<span>High</span>
					<span>Max</span>
				</div>
			</div>
		</div>
	)
}
