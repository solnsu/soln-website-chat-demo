export const RECORDING_SAMPLE_INTERVAL = 50;

export function buildRecordingOverview(samples: readonly number[], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor(index * samples.length / count);
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((index + 1) * samples.length / count)));
    let peak = 0;
    for (let sample = start; sample < end; sample++) peak = Math.max(peak, samples[sample]);
    return peak;
  });
}
