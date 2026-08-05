'use client';

import React from 'react';
import ModelControl from './ModelControl';
import ModelColors from './ModelColors';
import ScreenContent from './ScreenContent';
import Effect3DControls from './Effect3DControls';
import { use3DStore } from '@/store/use3DStore';

// Left-side column of the two right-side panels — controls the scene animation,
// device model parameters, screen content, finishes, and studio lighting.
export default function SceneControlsPanel({ isMockup = false }: { isMockup?: boolean }) {
  const mockupAnimation = use3DStore((s) => s.mockupAnimation || 'static');
  const mockupSpeed = use3DStore((s) => s.mockupSpeed || 1);
  const setMockupSpeed = use3DStore((s) => s.setMockupSpeed);

  return (
    <>
      <div className="section-head">
        <span className="eyebrow">Scene</span>
        <span className="badge" style={{ textTransform: 'capitalize' }}>
          {mockupAnimation.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="section-body">
        <div className="ctl-row">
          <label className="ctl-label">Speed</label>
          <div className="pills">
            {[0.5, 1, 1.5, 2].map((sp) => (
              <button
                key={sp}
                className={`pill ${mockupSpeed === sp ? 'active' : ''}`}
                onClick={() => setMockupSpeed(sp)}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hairline" />
      {isMockup && <ScreenContent />}
      {isMockup && <div className="hairline" />}
      <ModelControl />
      <div className="hairline" />
      <ModelColors />
      <div className="hairline" />
      <Effect3DControls />
    </>
  );
}
