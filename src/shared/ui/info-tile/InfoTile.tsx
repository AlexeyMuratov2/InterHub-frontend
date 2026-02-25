/**
 * Плитка с подписью и значением для сетки информации (семестр, часы и т.д.).
 */
export interface InfoTileProps {
  label: string;
  value: string;
}

export function InfoTile({ label, value }: InfoTileProps) {
  return (
    <div className="ed-info-tile">
      <span className="ed-info-tile-label">{label}</span>
      <span className="ed-info-tile-value">{value}</span>
    </div>
  );
}
