import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { BOSS_MAX_HP, FACTIONS, RANKS } from './mockData.js'

const W = 860; const H = 480;
const HP_H = 44; const ZONE_Y = HP_H + 8; const ZONE_H = H - ZONE_Y - 6;
const ZONE = { leloiX: 0, leloiW: 215, bossX: 215, bossW: 430, rightX: 645, rightW: 215, qtH: Math.floor(ZONE_H / 2) - 4, thdOffY: Math.floor(ZONE_H / 2) + 4 };

// Vẽ Boss (Cổ phong: To lớn, giáp trụ, tối màu)
function drawBossGraphic(g) {
  g.clear();
  g.beginFill(0x000000, 0.5); g.drawEllipse(0, 80, 70, 15); g.endFill(); // Bóng
  
  // Thân (Áo giáp đỏ son)
  g.beginFill(0x991b1b); g.drawRoundedRect(-50, -40, 100, 110, 10); g.endFill();
  g.lineStyle(3, 0xfbbf24); g.drawRoundedRect(-50, -40, 100, 110, 10); g.lineStyle(0); // Viền vàng
  
  // Đầu (Mũ giáp)
  g.beginFill(0x450a0a); g.drawCircle(0, -60, 45); g.endFill();
  g.lineStyle(2, 0xfbbf24); g.drawCircle(0, -60, 45); g.lineStyle(0);
  
  // Sừng
  g.beginFill(0xfbbf24); g.moveTo(-35, -85); g.lineTo(-60, -130); g.lineTo(-15, -90); g.closePath(); g.endFill();
  g.beginFill(0xfbbf24); g.moveTo(35, -85); g.lineTo(60, -130); g.lineTo(15, -90); g.closePath(); g.endFill();

  // Mắt (Đỏ rực)
  g.beginFill(0xff0000); g.drawCircle(-15, -65, 8); g.drawCircle(15, -65, 8); g.endFill();
}

function redrawHPBar(g, ratio) {
  g.clear(); const barX = 8, barY = 6, barW = W - 16, barH = HP_H - 10;
  g.beginFill(0x2a1a0a); g.drawRoundedRect(barX, barY, barW, barH, 7); g.endFill(); // Nền gỗ
  const filled = Math.max(0, barW * ratio);
  if (filled > 4) {
    const col = ratio > 0.5 ? 0x16a34a : ratio > 0.25 ? 0xd97706 : 0xdc2626;
    g.beginFill(col); g.drawRoundedRect(barX + 2, barY + 2, filled - 4, barH - 4, 5); g.endFill();
  }
  g.lineStyle(2, 0xd4af37); g.drawRoundedRect(barX, barY, barW, barH, 7); g.lineStyle(0); // Viền vàng đồng
}

// Hàm vẽ 1 chiến binh + Hào quang theo Rank
function drawWarrior(g, x, y, col, size, rankLevel) {
  // Hào quang (Aura)
  if (rankLevel >= 4) {
    const auraColor = RANKS[rankLevel].color;
    const hexColor = parseInt(auraColor.replace('#', '0x'));
    g.beginFill(hexColor, 0.3); g.drawCircle(x, y + size * 0.5, size * 1.5); g.endFill();
  }
  
  // Thân
  g.beginFill(col, 0.9); g.drawRoundedRect(x - size * 0.4, y, size * 0.8, size * 1.1, 3); g.endFill();
  // Đầu
  g.beginFill(col); g.drawCircle(x, y, size * 0.55); g.endFill();
  
  // Mũ giáp theo Rank
  g.beginFill(0xd4af37); // Vàng đồng
  g.drawEllipse(x, y - size * 0.4, size * 0.45, size * 0.25); g.endFill();
}

function spawnFloatingText(app, container, event) {
  const txt = new PIXI.Text(event.text, {
    fontSize: event.text.includes('MỞ RƯƠNG') || event.text.includes('THĂNG CHỨC') ? 22 : 16,
    fill: event.text.includes('MỞ RƯƠNG') ? '#fbbf24' : '#ffffff',
    fontWeight: 'bold', stroke: '#000000', strokeThickness: 4
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

export default function GameCanvas({ gameState, lastEvent, player }) {
  const containerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const refs = useRef({});

  useEffect(() => {
    const app = new PIXI.Application({ width: W, height: H, backgroundColor: 0x1a120c, antialias: true }); // Nền nâu gỗ tối
    containerRef.current.appendChild(app.view);
    pixiAppRef.current = app;
    const s = app.stage; const r = refs.current;

    // Vẽ nền các khu vực
    const zones = new PIXI.Graphics();
    zones.beginFill(0x2d1c15); // Nâu gỗ
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);
    zones.endFill();
    
    // Viền khu vực (Đỏ son)
    zones.lineStyle(2, 0x8b0000);
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.bossX + 3, ZONE_Y + 3, ZONE.bossW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);
    s.addChild(zones);

    // Vẽ Chiến binh
    const warriors = new PIXI.Graphics();
    drawWarrior(warriors, 80, ZONE_Y + 100, FACTIONS['1'].pixiColor, 20, player.rankLevel); // Vẽ 1 đại diện
    drawWarrior(warriors, W - 100, ZONE_Y + 80, FACTIONS['2'].pixiColor, 18, 0);
    drawWarrior(warriors, W - 100, ZONE_Y + ZONE.thdOffY + 80, FACTIONS['3'].pixiColor, 18, 0);
    s.addChild(warriors);
    r.warriors = warriors;

    // Vẽ Boss
    const bossContainer = new PIXI.Container();
    bossContainer.x = ZONE.bossX + ZONE.bossW / 2; bossContainer.y = ZONE_Y + ZONE_H / 2 + 20;
    const bossGfx = new PIXI.Graphics(); drawBossGraphic(bossGfx);
    bossContainer.addChild(bossGfx); s.addChild(bossContainer);
    r.bossContainer = bossContainer; r.bossHomeX = bossContainer.x; r.bossHomeY = bossContainer.y;

    // HP Bar
    const hpBarGfx = new PIXI.Graphics(); s.addChild(hpBarGfx); r.hpBarGfx = hpBarGfx; redrawHPBar(hpBarGfx, 1);

    // Floating Text
    const floatContainer = new PIXI.Container(); s.addChild(floatContainer); r.floatContainer = floatContainer;

    return () => app.destroy(true, { children: true });
  }, []);

  // Cập nhật khi có State mới
  useEffect(() => {
    if (!pixiAppRef.current) return;
    const r = refs.current;
    redrawHPBar(r.hpBarGfx, gameState.bossHP / BOSS_MAX_HP);
    
    // Cập nhật lại màu hào quang nếu rank thay đổi
    if (r.warriors) {
      r.warriors.clear();
      drawWarrior(r.warriors, 80, ZONE_Y + 100, FACTIONS['1'].pixiColor, 20, player.rankLevel);
      drawWarrior(r.warriors, W - 100, ZONE_Y + 80, FACTIONS['2'].pixiColor, 18, 0);
      drawWarrior(r.warriors, W - 100, ZONE_Y + ZONE.thdOffY + 80, FACTIONS['3'].pixiColor, 18, 0);
    }
  }, [gameState, player.rankLevel]);

  // Hiệu ứng khi có Event
  useEffect(() => {
    if (!lastEvent || !pixiAppRef.current) return;
    const app = pixiAppRef.current; const r = refs.current;
    if (r.floatContainer) spawnFloatingText(app, r.floatContainer, lastEvent);
    
    // Rung Boss
    if (lastEvent.type === 'attack' && r.bossContainer) {
      let elapsed = 0;
      const handler = (delta) => {
        elapsed += delta;
        r.bossContainer.x = r.bossHomeX + (Math.random() - 0.5) * 20 * (1 - elapsed / 20);
        if (elapsed >= 20) { r.bossContainer.x = r.bossHomeX; app.ticker.remove(handler); }
      };
      app.ticker.add(handler);
    }
  }, [lastEvent]);

  return (
    <div ref={containerRef} style={{ borderRadius: '12px', overflow: 'hidden', border: '4px solid #8b0000', boxShadow: '0 0 30px rgba(139, 0, 0, 0.5)' }} />
  );
}
