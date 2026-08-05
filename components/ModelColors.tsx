'use client';

import { use3DStore } from '@/store/use3DStore';
import { findDevice } from '@/three3d/devices';
import FillRow from './FillRow';

// Friendly display names for the bundled daisy groups (keys stay unchanged).
const PART_LABELS: Record<string, string> = { Cube: 'Center', Cylinder: 'Stem', Plane: 'Petals' };

// Per-part model colouring. Groups are detected generically by the effect and
// reported to the store. Each group uses the shared FillRow (solid / linear /
// radial), same pattern as the background. Click a part in the viewport to
// select/highlight its group here.
//
// For bundled devices, shows Finish colour swatches instead of per-part fills.
export default function ModelColors() {
  const modelUrl = use3DStore((s) => s.model.url);
  const parts = use3DStore((s) => s.parts);
  const partFills = use3DStore((s) => s.partFills);
  const selected = use3DStore((s) => s.selectedPart);
  const setPartFill = use3DStore((s) => s.setPartFill);
  const clearPartFill = use3DStore((s) => s.clearPartFill);
  const selectPart = use3DStore((s) => s.selectPart);
  const setParam = use3DStore((s) => s.setParam);

  const device = findDevice(modelUrl);

  // Bundled devices → Finish swatches (right panel)
  if (device) {
    return (
      <>
        <div className="section-head">
          <span className="eyebrow">Finish</span>
        </div>
        <div className="section-body mc-colors">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {device.finishes.map((f) => (
              <button
                key={f.key}
                title={f.label}
                onClick={() => {
                  setParam('mockup', 'useModelColor', 'Off');
                  setParam('mockup', 'color', f.hex);
                }}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: f.hex, border: '2px solid rgba(128,128,128,0.35)',
                  cursor: 'pointer', padding: 0,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onPointerEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="section-head">
        <span className="eyebrow">Model Colors</span>
        {selected && <button className="mc-reset-model" onClick={() => selectPart(null)}>clear selection</button>}
      </div>
      <div className="section-body mc-colors">
        {parts.length === 0 ? (
          <div className="mc-colors-hint">No model loaded yet.</div>
        ) : (
          <>
            <div className="mc-colors-hint">Click a part in the view to find its group.</div>
            {parts.map((key) => (
              <FillRow
                key={key}
                label={PART_LABELS[key] ?? key}
                fill={partFills[key]}
                allowNone
                selected={selected === key}
                onEnter={() => selectPart(key)}
                onLeave={() => selected === key && selectPart(null)}
                onType={(t) => (t === 'none' ? clearPartFill(key) : setPartFill(key, { type: t }))}
                onColor={(which, hex) => setPartFill(key, { [which]: hex })}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
