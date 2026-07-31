export type DataUnit = 'b' | 'B' | 'Kb' | 'KB' | 'Mb' | 'MB' | 'Gb' | 'GB' | 'KiB' | 'MiB' | 'GiB'
export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days'
const dataFactors: Record<DataUnit, number> = { b: 1, B: 8, Kb: 1e3, KB: 8e3, Mb: 1e6, MB: 8e6, Gb: 1e9, GB: 8e9, KiB: 8 * 1024, MiB: 8 * 1024 ** 2, GiB: 8 * 1024 ** 3 }
const timeFactors: Record<TimeUnit, number> = { seconds: 1, minutes: 60, hours: 3600, days: 86400 }

export const toBits = (value: number, unit: DataUnit) => validatePositive(value) * dataFactors[unit]
export const fromBits = (bits: number, unit: DataUnit) => bits / dataFactors[unit]
export const toSeconds = (value: number, unit: TimeUnit) => validatePositive(value) * timeFactors[unit]
export const efficiency = (overheadPercent: number) => {
  if (!Number.isFinite(overheadPercent) || overheadPercent < 0 || overheadPercent >= 100) throw new Error('Overhead must be from 0 up to, but not including, 100%.')
  return 1 - overheadPercent / 100
}
const validatePositive = (value: number) => { if (!Number.isFinite(value) || value <= 0) throw new Error('Values must be finite and greater than zero.'); return value }
export const transferSeconds = (size: number, sizeUnit: DataUnit, speed: number, speedUnit: DataUnit, overhead = 0) => toBits(size, sizeUnit) / (toBits(speed, speedUnit) * efficiency(overhead))
export const requiredBitsPerSecond = (size: number, sizeUnit: DataUnit, time: number, timeUnit: TimeUnit, overhead = 0) => toBits(size, sizeUnit) / (toSeconds(time, timeUnit) * efficiency(overhead))
export const transferableBits = (speed: number, speedUnit: DataUnit, time: number, timeUnit: TimeUnit, overhead = 0) => toBits(speed, speedUnit) * toSeconds(time, timeUnit) * efficiency(overhead)
export const utilization = (throughput: number, throughUnit: DataUnit, capacity: number, capacityUnit: DataUnit) => toBits(throughput, throughUnit) / toBits(capacity, capacityUnit) * 100
export const packetsPerSecond = (bandwidth: number, bandwidthUnit: DataUnit, packetBytes: number, overhead = 0) => toBits(bandwidth, bandwidthUnit) * efficiency(overhead) / (validatePositive(packetBytes) * 8)
export const humanDuration = (seconds: number) => seconds < 60 ? `${seconds.toFixed(2)} seconds` : seconds < 3600 ? `${(seconds / 60).toFixed(2)} minutes` : seconds < 86400 ? `${(seconds / 3600).toFixed(2)} hours` : `${(seconds / 86400).toFixed(2)} days`

