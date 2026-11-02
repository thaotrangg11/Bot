import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { BOSS_MAX_HP, FACTIONS, RANKS } from './mockData.js'

const W = 860; const H = 480;
const HP_H = 44; const ZONE_Y = HP_H + 8; const ZONE_H = H - ZONE_Y - 6;
const ZONE = { leloiX: 0, leloiW: 215, bossX: 215, bossW: 430, rightX: 645, rightW: 215, qtH: Math.floor(ZONE_H / 2) - 4, thdOffY: Math.floor(ZONE_H / 2) + 4 };

// Vẽ Boss (Tối ưu lại: Ác ma có giáp, có hiệu ứng phát sáng)
function drawBossGraphic(g) {
  g.clear();
  // Vẽ vầng sáng đỏ phía sau
  g.beginFill(0xff0000, 0.15); 
  for(let i=0; i<3; i++) g.drawCircle(0, 0, 100 - i*20);
  g.endFill();

  // Bóng đổ
  g.beginFill(0x000000, 0.6); g.drawEllipse(0, 80, 70, 15); g.endFill(); 
  
  // Áo giáp (Hình thang)
  g.beginFill(0x7f1d1d); // Đỏ sẫm
  g.moveTo(-60, 70); g.lineTo(60, 70); g.lineTo(40, -30); g.lineTo(-40, -30); g.closePath();
  g.endFill();
  g.lineStyle(3, 0xfbbf24); g.drawPolygon([-60, 70, 60, 70, 40, -30, -40, -30]); g.lineStyle(0); // Viền vàng

  // Vai giáp
  g.beginFill(0x450a0a); g.drawCircle(-50, -20, 25); g.drawCircle(50, -20, 25); g.endFill();
  g.lineStyle(2, 0xfbbf24); g.drawCircle(-50, -20, 25); g.drawCircle(50, -20, 25); g.lineStyle(0);

  // Đầu (Mũ giáp)
  g.beginFill(0x1a0505); g.drawCircle(0, -60, 40); g.endFill();
  g.lineStyle(3, 0xfbbf24); g.drawCircle(0, -60, 40); g.lineStyle(0);
  
  // Sừng quỷ
  g.beginFill(0xfbbf24); 
  g.moveTo(-25, -85); g.lineTo(-50, -130); g.lineTo(-10, -95); g.closePath(); 
  g.moveTo(25, -85); g.lineTo(50, -130); g.lineTo(10, -95); g.closePath(); 
  g.endFill();

  // Mắt (Đỏ rực phát sáng)
  g.beginFill(0xff0000); g.drawCircle(-15, -65, 10); g.drawCircle(15, -65, 10); g.endFill();
  g.beginFill(0xffaaaa); g.drawCircle(-15, -65, 4); g.drawCircle(15, -65, 4); g.endFill();
}

function redrawHPBar(g, ratio) {
  g.clear(); const barX = 8, barY = 6, barW = W - 16, barH = HP_H - 10;
  g.beginFill(0x1a0a0a); g.drawRoundedRect(barX, barY, barW, barH, 7); g.endFill(); 
  const filled = Math.max(0, barW * ratio);
  if (filled > 4) {
    const col = ratio > 0.5 ? 0x16a34a : ratio > 0.25 ? 0xd97706 : 0xdc2626;
    g.beginFill(col); g.drawRoundedRect(barX + 2, barY + 2, filled - 4, barH - 4, 5); g.endFill();
    // Hiệu ứng ánh sáng chạy trên thanh máu
    g.beginFill(0xffffff, 0.2); g.drawRoundedRect(barX + 2, barY + 2, filled - 4, (barH - 4)/2, 5); g.endFill();
  }
  g.lineStyle(2, 0xd4af37); g.drawRoundedRect(barX, barY, barW, barH, 7); g.lineStyle(0);
}

// Vẽ chiến binh (Giáp trụ, cầm vũ khí)
function drawWarrior(g, x, y, col, rankLevel) {
  // Hào quang
  if (rankLevel >= 4) {
    const hexColor = parseInt(RANKS[rankLevel].color.replace('#', '0x'));
    g.beginFill(hexColor, 0.3); g.drawCircle(x, y + 10, 30); g.endFill();
  }
  
  // Thân giáp
  g.beginFill(col, 1); g.drawRoundedRect(x - 10, y, 20, 25, 4); g.endFill();
  // Đầu
  g.beginFill(0xffccaa); g.drawCircle(x, y - 5, 10); g.endFill();
  // Mũ giáp
  g.beginFill(0xd4af37); g.drawEllipse(x, y - 10, 12, 6); g.endFill();
  // Khiên/Gươm (Tùy biến đơn giản)
  g.beginFill(0x94a3b8); g.drawRect(x - 18, y, 5, 20); g.endFill(); // Khiên
  g.beginFill(0xffffff); g.drawRect(x + 12, y - 5, 3, 25); g.endFill(); // Gươm
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

export default function GameCanvas({ gameState, lastEvent, player }) {
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
    // 3 Phe (Nền gỗ sẫm)
    zones.beginFill(0x2d1c15);
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);
    zones.endFill();
    // Boss (Nền đỏ sẫm)
    zones.beginFill(0x3a0a0a); zones.drawRoundedRect(ZONE.bossX + 3, ZONE_Y + 3, ZONE.bossW - 6, ZONE_H - 6, 10); zones.endFill();
    
    // Viền vàng đồng
    zones.lineStyle(3, 0xd4af37);
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.bossX + 3, ZONE_Y + 3, ZONE.bossW - 6, ZONE_H - 6, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);
    s.addChild(zones);

    // Chiến binh
    const warriors = new PIXI.Graphics();
    drawWarrior(warriors, 100, ZONE_Y + 100, FACTIONS['1'].pixiColor, player.rankLevel);
    drawWarrior(warriors, 160, ZONE_Y + 130, FACTIONS['1'].pixiColor, 0);
    drawWarrior(warriors, W - 100, ZONE_Y + 80, FACTIONS['2'].pixiColor, 0);
    drawWarrior(warriors, W - 100, ZONE_Y + ZONE.thdOffY + 80, FACTIONS['3'].pixiColor, 0);
    s.addChild(warriors);
    r.warriors = warriors;

    // Boss
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

  useEffect(() => {
    if (!pixiAppRef.current) return;
    const r = refs.current;
    redrawHPBar(r.hpBarGfx, gameState.bossHP / BOSS_MAX_HP);
    
    if (r.warriors) {
      r.warriors.clear();
      drawWarrior(r.warriors, 100, ZONE_Y + 100, FACTIONS['1'].pixiColor, player.rankLevel);
      drawWarrior(r.warriors, 160, ZONE_Y + 130, FACTIONS['1'].pixiColor, 0);
      drawWarrior(r.warriors, W - 100, ZONE_Y + 80, FACTIONS['2'].pixiColor, 0);
      drawWarrior(r.warriors, W - 100, ZONE_Y + ZONE.thdOffY + 80, FACTIONS['3'].pixiColor, 0);
    }
  }, [gameState, player.rankLevel]);

  useEffect(() => {
    if (!lastEvent || !pixiAppRef.current) return;
    const app = pixiAppRef.current; const r = refs.current;
    if (r.floatContainer) spawnFloatingText(app, r.floatContainer, lastEvent);
    
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
    <div ref={containerRef} style={{ 
      borderRadius: '12px', overflow: 'hidden', 
      border: '4px solid #d4af37', // Viền vàng
      boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
      maxWidth: '100%' // Fix responsive
    }} />
  );
}
