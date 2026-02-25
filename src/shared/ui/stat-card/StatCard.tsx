/**
 * Карточка статистики с акцентным цветом (зелёный, янтарный, красный, синий, нейтральный).
 */
export type StatCardAccent = 'green' | 'amber' | 'red' | 'blue' | 'neutral';

export interface StatCardProps {
  label: string;
  value: string;
  accent?: StatCardAccent;
}

export function StatCard({ label, value, accent = 'neutral' }: StatCardProps) {
  return (
    <div className={`ed-stat-card ed-stat-card--${accent}`}>
      <span className="ed-stat-value">{value}</span>
      <span className="ed-stat-label">{label}</span>
    </div>
  );
}
