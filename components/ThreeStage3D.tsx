'use client';

import { useEffect, useRef, useState } from 'react';
import { getThreeEffect, threeDefaults, threeEffects } from '@/three3d';
import { use3DStore } from '@/store/use3DStore';
import { isOn } from '@/three3d/asciiControls';
import type { CameraRig } from '@/three3d/cameraRig';
import { useSceneStore } from '@/store/useSceneStore';
import { setRendererInstance } from '@/lib/rendererInstance';
import type { IRenderer } from '@/lib/rendererTypes';
import ViewGizmo from './ViewGizmo';

// 3D preview stage. Renders the active 3D effect into a canvas, then layers CSS
// post-processing driven by use3DStore params. The effect is (re)initialised
// only when the effect id (or uploaded model) changes; params/model are read
// live from the store inside the render loop, so slider drags don't re-init.
export default function ThreeStage3D() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeEngineRef = useRef<{
    renderFrame: (frame: number) => void;
    setCaptureScale: (k: number) => void;
    captureFrame: (frame: number) => string;
  } | null>(null);
  const storeEffectId = use3DStore((s) => s.effectId);
  const def = getThreeEffect(storeEffectId) ?? threeEffects[0];   // guard stale ids
  const effectId = def.id;
  const overrides = use3DStore((s) => s.params[effectId]) ?? {};
  const dflts = threeDefaults(effectId);
  const p = { ...dflts, ...overrides };   // schema defaults + user edits
  const has = (k: string) => k in dflts;  // which controls this effect declares
  const modelUrl = use3DStore((s) => s.model.url);
  const width = useSceneStore((s) => s.width);
  const height = useSceneStore((s) => s.height);
  // effects that expose a camera get the view gizmo; the rest render without it
  const [rig, setRig] = useState<CameraRig | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const dispose = def.init(stage, canvas, {
      modelUrl: modelUrl ?? def.defaultModel,
      // read live from the store (schema defaults merged) — avoids re-init on drag
      getParams: () => ({ ...threeDefaults(effectId), ...(use3DStore.getState().params[effectId] ?? {}) }),
      getModel: () => use3DStore.getState().model,
      getPartFills: () => use3DStore.getState().partFills,
      getSelectedPart: () => use3DStore.getState().selectedPart,
      onParts: (keys) => use3DStore.getState().setParts(keys),
      onPickPart: (key) => use3DStore.getState().selectPart(key),
      getBgFill: () => use3DStore.getState().bgFill,
      getBgTex: () => ({ amount: use3DStore.getState().bgTexAmount, scale: use3DStore.getState().bgTexScale }),
      getSunShadow: () => use3DStore.getState().sunShadow,
      getSunlight: () => use3DStore.getState().sunIntensity,
      getSunMask: () => use3DStore.getState().sunMask,
      getSunMaskTransform: () => {
        const s = use3DStore.getState();
        return { scale: s.sunMaskScale, offX: s.sunMaskOffsetX, offY: s.sunMaskOffsetY };
      },
      onCamera: setRig,
      getScreenMedia: () => use3DStore.getState().screenMedia,
      onRenderer: (r) => { threeEngineRef.current = r; },
    });

    const threeRenderer: IRenderer = {
      init: async () => {},
      resize: () => {},
      getFrameState: (f) => { useSceneStore.getState().setFrame(f); },
      renderFrame: (f) => {
        if (threeEngineRef.current) {
          threeEngineRef.current.renderFrame(f);
        } else {
          useSceneStore.getState().setFrame(f);
        }
      },
      captureFrame: (f) => {
        if (threeEngineRef.current) {
          return threeEngineRef.current.captureFrame(f);
        }
        useSceneStore.getState().setFrame(f);
        const c = canvasRef.current;
        return c ? c.toDataURL('image/jpeg', 0.92) : '';
      },
      setCaptureScale: (k) => {
        if (threeEngineRef.current) {
          threeEngineRef.current.setCaptureScale(k);
        }
      },
      extractCanvas: () => canvasRef.current!,
      syncAssets: () => {},
      destroy: () => {},
    };
    setRendererInstance(threeRenderer);

    return () => {
      setRendererInstance(null);
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectId, modelUrl]);   // reload when effect or uploaded model changes

  // ── Drive timeline clock when playing in 3D / Mockup mode ──
  const playing = useSceneStore((s) => s.playing);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const st = useSceneStore.getState();
      const totalFrames = Math.max(1, Math.round(st.duration * st.fps));
      const nextFrame = (st.frame + dt * st.fps) % totalFrames;
      st.setFrame(nextFrame);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // ── CSS layers derived from params (only those the effect declares) ──
  const num = (k: string, d = 0) => Number(p[k] ?? d);
  const sat = num('saturation', 100);
  const gray = num('grayscale', 0);
  const tint = String(p.tint ?? '#00ff41');

  const filters: string[] = [];
  if (has('saturation') && sat !== 100) filters.push(`saturate(${sat}%)`);
  if (has('grayscale') && gray > 0) filters.push(`grayscale(${gray}%)`);

  const canvasStyle: React.CSSProperties = {
    filter: filters.length ? filters.join(' ') : undefined,
  };

  const bgFill = use3DStore((s) => s.bgFill);
  const background =
    bgFill.type === 'linear' ? `linear-gradient(to top, ${bgFill.c1} 0%, ${bgFill.c2} 100%)`
    : bgFill.type === 'radial' ? `radial-gradient(130% 130% at 50% 50%, ${bgFill.c1} 0%, ${bgFill.c2} 100%)`
    : bgFill.c1;
  const stageStyle: React.CSSProperties = { background };

  return (
    // fresh canvas per effect — ASCII uses a 2D context, Cartoon a WebGL one,
    // and a single <canvas> can't switch context types.
    <div className="stage-wrap" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="three3d-stage stage-canvas"
        ref={stageRef}
        style={{
          ...stageStyle,
          position: 'relative',
          aspectRatio: `${width} / ${height}`,
          width: width >= height ? '100%' : 'auto',
          height: height >= width ? '100%' : 'auto',
          minWidth: 280,
          minHeight: 280,
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <canvas key={effectId} className="three3d-layer three3d-ascii" ref={canvasRef} style={canvasStyle} />

        {has('tint') && (
          <div
            className="three3d-lens three3d-tint"
            style={{ background: tint, opacity: num('tintOpacity', 0) / 100, mixBlendMode: (p.blend as any) ?? 'hue' }}
          />
        )}
        {has('vignette') && <div className="three3d-lens three3d-vignette" style={{ opacity: num('vignette', 0) / 100 }} />}
        {has('enableMask') && isOn(p.enableMask) && <div className="three3d-lens three3d-mask" />}
        {has('dotGrid') && isOn(p.dotGrid) && <div className="three3d-lens three3d-dotgrid" />}

        {rig && <ViewGizmo rig={rig} />}
      </div>
    </div>
  );
}
