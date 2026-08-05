'use client';

import React, { useState } from 'react';
import CanvasPanel from './CanvasPanel';
import ScreenContent from './ScreenContent';
import ModelControl from './ModelControl';
import ModelColors from './ModelColors';
import BackgroundFill from './BackgroundFill';
import Effect3DControls from './Effect3DControls';
import { useSceneStore } from '@/store/useSceneStore';
import ExportDialog from './ExportDialog';

// Two distinct stacked panels in the right sidebar — matching the Library 2D layout:
// Panel 1: Scene Controls (Canvas, Screen Content, Model Controls, Finish Colors, Background, Studio Lights)
// Panel 2: Export Controls (Format, Resolution Quality, Frame Rate, Duration & Start Export Render button)
export default function MockupRightPanel({ isMockup = false }: { isMockup?: boolean }) {
  const [exportOpen, setExportOpen] = useState(false);

  // Scene store values for Export panel
  const fps = useSceneStore((s) => s.fps);
  const setFps = useSceneStore((s) => s.setFps);
  const duration = useSceneStore((s) => s.duration);
  const setDuration = useSceneStore((s) => s.setDuration);
  const width = useSceneStore((s) => s.width);
  const height = useSceneStore((s) => s.height);

  const [exportFormat, setExportFormat] = useState<'mp4' | 'gif' | 'png'>('mp4');
  const [targetRes, setTargetRes] = useState<'1080p' | '2k' | '4k'>('1080p');

  return (
    <>
      {/* ── PANEL 1: Scene Controls ── */}
      <CanvasPanel is3DMode />
      <div className="hairline" />
      {isMockup && <ScreenContent />}
      {isMockup && <div className="hairline" />}
      <ModelControl />
      <div className="hairline" />
      <ModelColors />
      <div className="hairline" />
      <BackgroundFill hideTexture={isMockup} />
      <div className="hairline" />
      <Effect3DControls />
      <div className="hairline" />

      {/* ── PANEL 2: Export Controls ── */}
      <div className="section-head">
        <span className="eyebrow">Export & Render</span>
      </div>

      <div className="section-body">
        {/* Format Picker */}
        <div className="ctl-row" style={{ marginBottom: 14 }}>
          <label className="ctl-label">Format</label>
          <div className="pills">
            <button
              className={`pill ${exportFormat === 'mp4' ? 'active' : ''}`}
              onClick={() => setExportFormat('mp4')}
            >
              MP4 Video
            </button>
            <button
              className={`pill ${exportFormat === 'gif' ? 'active' : ''}`}
              onClick={() => setExportFormat('gif')}
            >
              GIF Anim
            </button>
            <button
              className={`pill ${exportFormat === 'png' ? 'active' : ''}`}
              onClick={() => setExportFormat('png')}
            >
              PNG Frame
            </button>
          </div>
        </div>

        {/* Resolution Preset */}
        <div className="ctl-row" style={{ marginBottom: 14 }}>
          <label className="ctl-label">Quality</label>
          <div className="pills">
            <button
              className={`pill ${targetRes === '1080p' ? 'active' : ''}`}
              onClick={() => setTargetRes('1080p')}
            >
              1080p HD
            </button>
            <button
              className={`pill ${targetRes === '2k' ? 'active' : ''}`}
              onClick={() => setTargetRes('2k')}
            >
              2K QHD
            </button>
            <button
              className={`pill ${targetRes === '4k' ? 'active' : ''}`}
              onClick={() => setTargetRes('4k')}
            >
              4K Ultra
            </button>
          </div>
        </div>

        {/* FPS Selector */}
        <div className="ctl-row" style={{ marginBottom: 14 }}>
          <label className="ctl-label">Frame Rate</label>
          <div className="pills">
            {[30, 60].map((rate) => (
              <button
                key={rate}
                className={`pill ${fps === rate ? 'active' : ''}`}
                onClick={() => setFps(rate)}
              >
                {rate} FPS
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selector */}
        <div className="ctl-row" style={{ marginBottom: 14 }}>
          <label className="ctl-label">Duration</label>
          <div className="pills">
            {[2, 4, 8, 12].map((sec) => (
              <button
                key={sec}
                className={`pill ${duration === sec ? 'active' : ''}`}
                onClick={() => setDuration(sec)}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Info summary */}
        <div className="ctl-hint" style={{ marginBottom: 16 }}>
          Target size: {targetRes === '4k' ? width * 2 : targetRes === '2k' ? Math.round(width * 1.5) : width} × {targetRes === '4k' ? height * 2 : targetRes === '2k' ? Math.round(height * 1.5) : height} px. Batch parallel rendering enabled.
        </div>

        {/* Render Button */}
        <button
          className="btn full solid"
          style={{ height: 38, fontWeight: 600, background: '#E6FF55', color: '#000' }}
          onClick={() => setExportOpen(true)}
        >
          Start Export Render
        </button>
      </div>

      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </>
  );
}
