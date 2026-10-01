type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <progress className="progress" value={boundedValue} max={100} aria-label={`${boundedValue}% complete`}>
      {boundedValue}%
    </progress>
  );
}
