import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { BOSS_MAX_HP, FACTIONS } from './mockData.js'
import Boss3D from './Boss3D.jsx' // Import Boss 3D

const W = 860; const H = 480;
const HP_H = 44; const ZONE_Y = HP_H + 8; const ZONE_H = H - ZONE_Y - 6;
const ZONE = { leloiX: 0, leloiW: 215, bossX: 215, bossW: 430, rightX: 645, rightW: 215, qtH: Math.floor(ZONE_H / 2) - 4, thdOffY: Math.floor(ZONE_H / 2) + 4 };

function redrawHPBar(g, ratio) {
  g.clear(); const barX = 8, barY = 6, barW = W - 16, barH = HP_H - 10;
  g.beginFill(0x1a0a0a); g.drawRoundedRect(barX, barY, barW, barH, 7); g.endFill(); 
  const filled = Math.max(0, barW * ratio);
  if (filled > 4) {
    const col = ratio > 0.5 ? 0x16a34a : ratio > 0.25 ? 0xd97706 : 0xdc2626;
    g.beginFill(col); g.drawRoundedRect(barX + 2, barY + 2, filled - 4, barH - 4, 5); g.endFill();
    g.beginFill(0xffffff, 0.2); g.drawRoundedRect(barX + 2, barY + 2, filled - 4, (barH - 4)/2, 5); g.endFill();
  }
  g.lineStyle(2, 0xd4af37); g.drawRoundedRect(barX, barY, barW, barH, 7); g.lineStyle(0);
}

function spawnFloatingText(app, container, event) {
  const txt = new PIXI.Text(event.text, {
    fontSize: event.text.includes('MỞ RƯƠNG') || event.text.includes('THĂNG CHỨC') ? 24 : 16,
    fill: event.text.includes('MỞ RƯƠNG') ? '#fbbf24' : '#ffffff',
    fontWeight: '900', stroke: '#000000', strokeThickness: 4, dropShadow: true, dropShadowBlur: 4
  });
  txt.anchor.set(0.5, 0.5);
  txt.x = W / 2 + (Math.random() - 0.5) * 200;
  txt.y = H / 2 + (Math.random() - 0.5) * 100;
  container.addChild(txt);
  
  let elapsed = 0;
  const handler = (delta) => {
    elapsed += delta; txt.y -= 2 * delta; txt.alpha = Math.max(0, 1 - elapsed / 80);
    if (elapsed >= 80) { app.ticker.remove(handler); container.removeChild(txt); txt.destroy(); }
  };
  app.ticker.add(handler);
}

export default function GameCanvas({ gameState, lastEvent, player, isHit }) {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const refs = useRef({});

  useEffect(() => {
    const app = new PIXI.Application({ width: W, height: H, backgroundColor: 0x1a120c, antialias: true }); 
    containerRef.current.appendChild(app.view);
    pixiAppRef.current = app;
    const s = app.stage; const r = refs.current;

    // Nền bản đồ
    const zones = new PIXI.Graphics();
    zones.beginFill(0x2d1c15);
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);
    zones.endFill();
    // Khu vực Boss (để trống cho 3D)
    zones.beginFill(0x3a0a0a); zones.drawRoundedRect(ZONE.bossX + 3, ZONE_Y + 3, ZONE.bossW - 6, ZONE_H - 6, 10); zones.endFill();
    zones.lineStyle(3, 0xd4af37);
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.bossX + 3, ZONE_Y + 3, ZONE.bossW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);
    s.addChild(zones);

    // HP Bar
    const hpBarGfx = new PIXI.Graphics(); s.addChild(hpBarGfx); r.hpBarGfx = hpBarGfx; redrawHPBar(hpBarGfx, 1);

    // Floating Text
    const floatContainer = new PIXI.Container(); s.addChild(floatContainer); r.floatContainer = floatContainer;

    return () => app.destroy(true, { children: true });
  }, []);

  useEffect(() => {
    if (!pixiAppRef.current) return;
    const r = refs.current;
    redrawHPBar(r.hpBarGfx, gameState.bossHP / BOSS_MAX_HP);
  }, [gameState]);

  useEffect(() => {
    if (!lastEvent || !pixiAppRef.current) return;
    const app = pixiAppRef.current; const r = refs.current;
    if (r.floatContainer) spawnFloatingText(app, r.floatContainer, lastEvent);
  }, [lastEvent]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '860px', margin: '0 auto' }}>
      <div ref={containerRef} style={{ 
        borderRadius: '12px', overflow: 'hidden', 
        border: '4px solid #d4af37',
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
      }} />
      {/* Chèn Boss 3D đè lên trên khu vực giữa */}
      <Boss3D isHit={isHit} />
    </div>
  );
}
