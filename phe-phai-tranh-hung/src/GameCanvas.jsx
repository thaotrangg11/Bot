import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { BOSS_MAX_HP, FACTIONS } from './mockData.js'

// ============================================================
// GameCanvas.jsx — Toàn bộ logic đồ họa Pixi.js
// ============================================================

// Kích thước canvas cố định
const W = 860;
const H = 480;

// Các vùng hiển thị
const HP_H = 44;           // Chiều cao thanh máu boss
const ZONE_Y = HP_H + 8;  // Y bắt đầu của các vùng chiến đấu
const ZONE_H = H - ZONE_Y - 6;

// Toạ độ các khu vực
const ZONE = {
  leloiX: 0, leloiW: 215,
  bossX: 215, bossW: 430,
  rightX: 645, rightW: 215,
  qtH: Math.floor(ZONE_H / 2) - 4,
  thdOffY: Math.floor(ZONE_H / 2) + 4,
};

// ────────────────────────────────────────────
// Hàm vẽ Boss (hình quái vật đơn giản)
// ────────────────────────────────────────────
function drawBossGraphic(g) {
  g.clear();

  // Vầng hào quang đỏ mờ
  g.beginFill(0xff0000, 0.06);
  g.drawCircle(0, 0, 100);
  g.endFill();

  // Bóng đổ xuống đất
  g.beginFill(0x000000, 0.35);
  g.drawEllipse(0, 78, 65, 14);
  g.endFill();

  // Sừng trái
  g.beginFill(0x7a0000);
  g.moveTo(-28, -60);
  g.lineTo(-55, -115);
  g.lineTo(-8, -65);
  g.closePath();
  g.endFill();

  // Sừng phải
  g.beginFill(0x7a0000);
  g.moveTo(28, -60);
  g.lineTo(55, -115);
  g.lineTo(8, -65);
  g.closePath();
  g.endFill();

  // Thân Boss — vòng tròn đỏ lớn
  g.beginFill(0xb91c1c);
  g.drawCircle(0, 0, 75);
  g.endFill();

  // Vệt sáng bên trong (highlight)
  g.beginFill(0xff3333, 0.35);
  g.drawEllipse(-18, -25, 38, 28);
  g.endFill();

  // Viền boss
  g.lineStyle(3, 0xff6b6b, 0.9);
  g.drawCircle(0, 0, 75);
  g.lineStyle(0);

  // Mắt trái (trắng + đồng tử)
  g.beginFill(0xffff55);
  g.drawCircle(-23, -16, 13);
  g.endFill();
  g.beginFill(0x000000);
  g.drawCircle(-21, -14, 7);
  g.endFill();
  g.beginFill(0xff0000);
  g.drawCircle(-19, -12, 3);
  g.endFill();

  // Mắt phải
  g.beginFill(0xffff55);
  g.drawCircle(23, -16, 13);
  g.endFill();
  g.beginFill(0x000000);
  g.drawCircle(25, -14, 7);
  g.endFill();
  g.beginFill(0xff0000);
  g.drawCircle(27, -12, 3);
  g.endFill();

  // Miệng quái
  g.lineStyle(3, 0x000000, 1);
  g.moveTo(-28, 22);
  g.quadraticCurveTo(0, 48, 28, 22);
  g.lineStyle(0);

  // Răng nanh
  g.beginFill(0xffffff);
  g.moveTo(-18, 28);
  g.lineTo(-10, 44);
  g.lineTo(-4, 30);
  g.closePath();
  g.endFill();
  g.beginFill(0xffffff);
  g.moveTo(4, 30);
  g.lineTo(10, 44);
  g.lineTo(18, 28);
  g.closePath();
  g.endFill();
}

// ────────────────────────────────────────────
// Hàm vẽ HP Bar của Boss
// ────────────────────────────────────────────
function redrawHPBar(g, ratio) {
  g.clear();
  const barX = 8, barY = 6, barW = W - 16, barH = HP_H - 10;

  // Nền đen
  g.beginFill(0x111111);
  g.drawRoundedRect(barX, barY, barW, barH, 7);
  g.endFill();

  // Phần máu còn lại
  const filled = Math.max(0, barW * ratio);
  if (filled > 4) {
    const col = ratio > 0.5 ? 0x16a34a : ratio > 0.25 ? 0xd97706 : 0xdc2626;
    g.beginFill(col);
    g.drawRoundedRect(barX + 2, barY + 2, filled - 4, barH - 4, 5);
    g.endFill();

    // Highlight trên cùng
    g.beginFill(0xffffff, 0.18);
    g.drawRoundedRect(barX + 2, barY + 2, filled - 4, Math.floor((barH - 4) / 2), 4);
    g.endFill();
  }

  // Viền
  g.lineStyle(1, 0x444466, 0.7);
  g.drawRoundedRect(barX, barY, barW, barH, 7);
  g.lineStyle(0);
}

// ────────────────────────────────────────────
// Vẽ chiến binh đơn giản (hình nhân tố)
// ────────────────────────────────────────────
function drawWarriors(stage) {
  const g = new PIXI.Graphics();

  // Hàm vẽ 1 chiến binh: đầu (circle) + thân (hình chữ nhật nhỏ)
  const warrior = (x, y, col, size = 16) => {
    // Thân
    g.beginFill(col, 0.9);
    g.drawRoundedRect(x - size * 0.4, y, size * 0.8, size * 1.1, 3);
    g.endFill();
    // Đầu
    g.beginFill(col);
    g.drawCircle(x, y, size * 0.55);
    g.endFill();
    // Mũ giáp
    g.beginFill(col + 0x111111 > 0xffffff ? col : col + 0x111111);
    g.drawEllipse(x, y - size * 0.4, size * 0.45, size * 0.25);
    g.endFill();
  };

  // Chiến binh Lê Lợi (trái, xanh)
  const LL = FACTIONS['1'].pixiColor;
  warrior(55, ZONE_Y + 60, LL, 18);
  warrior(100, ZONE_Y + 95, LL, 16);
  warrior(65, ZONE_Y + 140, LL, 20);
  warrior(140, ZONE_Y + 75, LL, 15);
  warrior(95, ZONE_Y + 200, LL, 17);
  warrior(45, ZONE_Y + 270, LL, 16);
  warrior(155, ZONE_Y + 240, LL, 14);

  // Chiến binh Quang Trung (phải trên, vàng)
  const QT = FACTIONS['2'].pixiColor;
  warrior(W - 160, ZONE_Y + 50, QT, 17);
  warrior(W - 110, ZONE_Y + 80, QT, 15);
  warrior(W - 70, ZONE_Y + 55, QT, 18);
  warrior(W - 140, ZONE_Y + 120, QT, 14);

  // Chiến binh Trần Hưng Đạo (phải dưới, tím)
  const THD = FACTIONS['3'].pixiColor;
  warrior(W - 155, ZONE_Y + ZONE.thdOffY + 35, THD, 17);
  warrior(W - 100, ZONE_Y + ZONE.thdOffY + 65, THD, 16);
  warrior(W - 65, ZONE_Y + ZONE.thdOffY + 40, THD, 18);
  warrior(W - 135, ZONE_Y + ZONE.thdOffY + 115, THD, 15);

  stage.addChild(g);
}

// ────────────────────────────────────────────
// Tạo chữ bay lên (Floating Damage Text)
// ────────────────────────────────────────────
function spawnFloatingText(app, floatContainer, event) {
  // Màu dựa theo loại event
  const colorMap = {
    attack: '#ff6b6b',
    gift: '#ffd700',
    join: '#a0f0a0',
  };
  const color = colorMap[event.type] || '#ffffff';
  const size = event.type === 'gift' ? 19 : 15;

  const txt = new PIXI.Text(event.text, {
    fontSize: size,
    fill: color,
    fontWeight: 'bold',
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowDistance: 2,
  });

  // Xuất hiện ngẫu nhiên trong vùng Boss
  txt.anchor.set(0.5, 0.5);
  txt.x = ZONE.bossX + ZONE.bossW / 2 + (Math.random() - 0.5) * 120;
  txt.y = ZONE_Y + ZONE_H / 2 - 30 + (Math.random() - 0.5) * 40;
  floatContainer.addChild(txt);

  let elapsed = 0;
  const handler = (delta) => {
    elapsed += delta;
    txt.y -= 1.8 * (delta / 2);
    txt.alpha = Math.max(0, 1 - elapsed / 90);

    if (elapsed >= 90) {
      app.ticker.remove(handler);
      if (floatContainer.children.includes(txt)) {
        floatContainer.removeChild(txt);
        txt.destroy();
      }
    }
  };
  app.ticker.add(handler);
}

// ────────────────────────────────────────────
// Hiệu ứng Boss rung lên khi bị đánh
// ────────────────────────────────────────────
function shakeBoss(app, bossContainer, bossHomeX, bossHomeY) {
  let elapsed = 0;

  const handler = (delta) => {
    elapsed += delta;
    const strength = Math.max(0, 9 * (1 - elapsed / 25));
    bossContainer.x = bossHomeX + (Math.random() - 0.5) * strength * 2;
    bossContainer.y = bossHomeY + (Math.random() - 0.5) * strength;

    if (elapsed >= 25) {
      bossContainer.x = bossHomeX;
      bossContainer.y = bossHomeY;
      app.ticker.remove(handler);
    }
  };
  app.ticker.add(handler);
}

// ============================================================
// Component chính
// ============================================================
export default function GameCanvas({ gameState, lastEvent }) {
  const containerRef = useRef(null);    // DOM ref để append canvas
  const pixiAppRef = useRef(null);      // PIXI.Application instance
  const refs = useRef({});              // Lưu các PIXI object cần update

  // ── KHỞI TẠO PIXI.JS (chỉ chạy 1 lần khi mount) ──
  useEffect(() => {
    const app = new PIXI.Application({
      width: W,
      height: H,
      backgroundColor: 0x0a0a1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerRef.current.appendChild(app.view);
    pixiAppRef.current = app;
    const s = app.stage;
    const r = refs.current;

    // ── Vẽ nền khu vực 3 phe ──
    const zones = new PIXI.Graphics();

    // Nền khu vực Lê Lợi
    zones.beginFill(FACTIONS['1'].bgColor, 0.8);
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);
    zones.endFill();
    zones.lineStyle(2, FACTIONS['1'].pixiColor, 0.7);
    zones.drawRoundedRect(3, ZONE_Y + 3, ZONE.leloiW - 6, ZONE_H - 6, 10);

    // Nền khu vực Boss (trung tâm)
    zones.lineStyle(0);
    zones.beginFill(0x110000, 0.75);
    zones.drawRoundedRect(ZONE.bossX + 3, ZONE_Y + 3, ZONE.bossW - 6, ZONE_H - 6, 10);
    zones.endFill();
    zones.lineStyle(2, 0xcc2222, 0.4);
    zones.drawRoundedRect(ZONE.bossX + 3, ZONE_Y + 3, ZONE.bossW - 6, ZONE_H - 6, 10);

    // Nền khu vực Quang Trung (phải trên)
    zones.lineStyle(0);
    zones.beginFill(FACTIONS['2'].bgColor, 0.8);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);
    zones.endFill();
    zones.lineStyle(2, FACTIONS['2'].pixiColor, 0.7);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + 3, ZONE.rightW - 6, ZONE.qtH - 3, 10);

    // Nền khu vực Trần Hưng Đạo (phải dưới)
    zones.lineStyle(0);
    zones.beginFill(FACTIONS['3'].bgColor, 0.8);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);
    zones.endFill();
    zones.lineStyle(2, FACTIONS['3'].pixiColor, 0.7);
    zones.drawRoundedRect(ZONE.rightX + 3, ZONE_Y + ZONE.thdOffY + 3, ZONE.rightW - 6, ZONE_H - ZONE.thdOffY - 6, 10);

    s.addChild(zones);

    // ── Nhãn phe ──
    const mkLabel = (text, x, y, color, size = 14) => {
      const t = new PIXI.Text(text, {
        fontSize: size, fill: color, fontWeight: 'bold',
        dropShadow: true, dropShadowDistance: 1, dropShadowColor: '#000000',
      });
      t.anchor.set(0.5, 0);
      t.x = x; t.y = y;
      s.addChild(t);
      return t;
    };

    mkLabel(`${FACTIONS['1'].icon} Lê Lợi`, ZONE.leloiW / 2, ZONE_Y + 10, '#60a5fa', 14);
    mkLabel(`${FACTIONS['2'].icon} Quang Trung`, ZONE.rightX + ZONE.rightW / 2, ZONE_Y + 8, '#fbbf24', 13);
    mkLabel(`${FACTIONS['3'].icon} Trần Hưng Đạo`, ZONE.rightX + ZONE.rightW / 2, ZONE_Y + ZONE.thdOffY + 8, '#a78bfa', 12);
    mkLabel('👹 ĐẠI MA VƯƠNG', W / 2, ZONE_Y + 8, '#ff6b6b', 16);

    // ── Vẽ chiến binh ──
    drawWarriors(s);

    // ── Vẽ Boss ──
    const bossContainer = new PIXI.Container();
    const bossHomeX = ZONE.bossX + ZONE.bossW / 2;
    const bossHomeY = ZONE_Y + ZONE_H / 2 + 15;
    bossContainer.x = bossHomeX;
    bossContainer.y = bossHomeY;

    const bossGfx = new PIXI.Graphics();
    drawBossGraphic(bossGfx);
    bossContainer.addChild(bossGfx);
    s.addChild(bossContainer);

    r.bossContainer = bossContainer;
    r.bossHomeX = bossHomeX;
    r.bossHomeY = bossHomeY;

    // ── HP Bar ──
    const hpBarGfx = new PIXI.Graphics();
    s.addChild(hpBarGfx);
    r.hpBarGfx = hpBarGfx;
    redrawHPBar(hpBarGfx, 1); // Vẽ lần đầu đầy máu

    // Text "Boss HP"
    const hpLabelText = new PIXI.Text('BOSS HP', {
      fontSize: 13, fill: '#ffffff', fontWeight: 'bold',
    });
    hpLabelText.x = 16;
    hpLabelText.y = 13;
    s.addChild(hpLabelText);

    // Số HP hiển thị giữa thanh
    const hpValueText = new PIXI.Text(`${BOSS_MAX_HP.toLocaleString()} / ${BOSS_MAX_HP.toLocaleString()}`, {
      fontSize: 13, fill: '#ffffff',
    });
    hpValueText.anchor.set(0.5, 0);
    hpValueText.x = W / 2;
    hpValueText.y = 12;
    s.addChild(hpValueText);
    r.hpValueText = hpValueText;

    // ── Text Damage từng phe (cuối zone) ──
    const mkDmgText = (x, y, color) => {
      const t = new PIXI.Text('0 DMG', { fontSize: 13, fill: color });
      t.anchor.set(0.5, 1);
      t.x = x; t.y = y;
      s.addChild(t);
      return t;
    };
    r.dmgText1 = mkDmgText(ZONE.leloiW / 2, ZONE_Y + ZONE_H - 10, '#93c5fd');
    r.dmgText2 = mkDmgText(ZONE.rightX + ZONE.rightW / 2, ZONE_Y + ZONE.qtH - 8, '#fde68a');
    r.dmgText3 = mkDmgText(ZONE.rightX + ZONE.rightW / 2, ZONE_Y + ZONE_H - 10, '#c4b5fd');

    // ── Container chứa floating text (để ở trên cùng) ──
    const floatContainer = new PIXI.Container();
    s.addChild(floatContainer);
    r.floatContainer = floatContainer;

    // ── Winner Overlay ──
    const winnerOverlay = new PIXI.Container();
    winnerOverlay.visible = false;

    const winnerBg = new PIXI.Graphics();
    winnerBg.beginFill(0x000000, 0.78);
    winnerBg.drawRect(0, 0, W, H);
    winnerBg.endFill();
    winnerOverlay.addChild(winnerBg);

    const winnerMainText = new PIXI.Text('', {
      fontSize: 40,
      fill: '#ffd700',
      fontWeight: '900',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowDistance: 4,
      dropShadowBlur: 6,
    });
    winnerMainText.anchor.set(0.5, 0.5);
    winnerMainText.x = W / 2;
    winnerMainText.y = H / 2 - 30;
    winnerOverlay.addChild(winnerMainText);

    const winnerSubText = new PIXI.Text('Game sẽ reset sau 5 giây...', {
      fontSize: 17, fill: '#94a3b8',
    });
    winnerSubText.anchor.set(0.5, 0.5);
    winnerSubText.x = W / 2;
    winnerSubText.y = H / 2 + 30;
    winnerOverlay.addChild(winnerSubText);

    s.addChild(winnerOverlay);
    r.winnerOverlay = winnerOverlay;
    r.winnerMainText = winnerMainText;

    // Cleanup khi unmount
    return () => {
      app.destroy(true, { children: true, texture: true });
      pixiAppRef.current = null;
    };
  }, []); // Chỉ chạy 1 lần

  // ── CẬP NHẬT HP BAR & ĐIỂM KHI GAME STATE THAY ĐỔI ──
  useEffect(() => {
    if (!pixiAppRef.current) return;
    const r = refs.current;

    // Update HP bar
    const ratio = gameState.bossHP / BOSS_MAX_HP;
    if (r.hpBarGfx) redrawHPBar(r.hpBarGfx, ratio);
    if (r.hpValueText) {
      r.hpValueText.text = `${gameState.bossHP.toLocaleString()} / ${BOSS_MAX_HP.toLocaleString()}`;
    }

    // Update damage text từng phe
    if (r.dmgText1) r.dmgText1.text = `${gameState.factions['1'].damage.toLocaleString()} DMG`;
    if (r.dmgText2) r.dmgText2.text = `${gameState.factions['2'].damage.toLocaleString()} DMG`;
    if (r.dmgText3) r.dmgText3.text = `${gameState.factions['3'].damage.toLocaleString()} DMG`;

    // Hiện/ẩn winner overlay
    if (r.winnerOverlay) {
      if (gameState.winner) {
        const faction = FACTIONS[gameState.winner];
        r.winnerMainText.text = `🏆 Phe ${faction.name} Chiến Thắng! 🏆`;
        r.winnerMainText.style.fill = faction.colorHex;
        r.winnerOverlay.visible = true;
      } else {
        r.winnerOverlay.visible = false;
      }
    }
  }, [gameState]);

  // ── TRIGGER HIỆU ỨNG KHI CÓ EVENT MỚI ──
  useEffect(() => {
    if (!lastEvent || !pixiAppRef.current) return;
    const app = pixiAppRef.current;
    const r = refs.current;

    // Floating text
    if (r.floatContainer) {
      spawnFloatingText(app, r.floatContainer, lastEvent);
    }

    // Boss rung khi bị đánh / tặng quà tấn công
    if ((lastEvent.type === 'attack' || lastEvent.type === 'gift') && r.bossContainer) {
      shakeBoss(app, r.bossContainer, r.bossHomeX, r.bossHomeY);
    }
  }, [lastEvent]);

  return (
    <div
      ref={containerRef}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid #1e1e4f',
        maxWidth: '870px',
        width: '100%',
        lineHeight: 0, // Loại bỏ khoảng trắng dưới canvas
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.15)',
      }}
    />
  );
}
