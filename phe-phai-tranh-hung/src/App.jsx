import React, { useState, useEffect, useCallback, useRef } from 'react'
import GameCanvas from './GameCanvas.jsx'
import { BOSS_MAX_HP, FACTIONS, GIFTS, createInitialState } from './mockData.js'

// ============================================================
// App.jsx — Component gốc, quản lý toàn bộ game state
// ============================================================

export default function App() {
  // State game chính
  const [gameState, setGameState] = useState(createInitialState());
  
  // State control panel
  const [username, setUsername] = useState('Khán giả 1');
  
  // Event cuối cùng để trigger hiệu ứng trong GameCanvas
  const [lastEvent, setLastEvent] = useState(null);
  
  // Ref để track event (dùng object với timestamp để force re-trigger dù cùng loại event)
  const eventCountRef = useRef(0);

  // ────────────────────────────────────────────
  // GAME LOOP: Tự động trừ máu Boss mỗi giây
  // Dựa trên tổng Damage tích lũy của 3 phe
  // ────────────────────────────────────────────
  useEffect(() => {
    // Dừng game loop khi đã có người thắng
    if (gameState.winner) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.winner) return prev; // Guard: đã có người thắng

        // Tính DPS thụ động = tổng damage tích lũy / 200
        // (Cần tích 200 damage tổng để Boss mất 1 HP/giây)
        const totalDamage = Object.values(prev.factions).reduce(
          (sum, f) => sum + f.damage, 0
        );
        const dps = Math.floor(totalDamage / 200);
        if (dps === 0) return prev; // Chưa đủ damage để auto-drain

        const newHP = Math.max(0, prev.bossHP - dps);

        // Nếu Boss chết
        if (newHP <= 0) {
          // Tìm phe có damage cao nhất
          const winnerFactionId = Object.entries(prev.factions)
            .sort(([, a], [, b]) => b.damage - a.damage)[0][0];

          // Reset game sau 5 giây
          setTimeout(() => {
            setGameState(createInitialState());
          }, 5000);

          return { ...prev, bossHP: 0, winner: winnerFactionId };
        }

        return { ...prev, bossHP: newHP };
      });
    }, 1000); // Mỗi giây 1 lần

    return () => clearInterval(interval);
  }, [gameState.winner]); // Re-run khi winner thay đổi (reset sau khi có người thắng)

  // ────────────────────────────────────────────
  // ACTION: Người dùng chọn phe
  // ────────────────────────────────────────────
  const handleJoinFaction = useCallback((factionId) => {
    const name = username.trim();
    if (!name) return;

    setGameState(prev => ({
      ...prev,
      userFactions: { ...prev.userFactions, [name]: factionId },
    }));

    eventCountRef.current += 1;
    setLastEvent({
      type: 'join',
      username: name,
      factionId,
      damage: 0,
      text: `${name} gia nhập ${FACTIONS[factionId].name}!`,
      _id: eventCountRef.current, // Force re-trigger
    });
  }, [username]);

  // ────────────────────────────────────────────
  // ACTION: Đánh Boss (!danh)
  // ────────────────────────────────────────────
  const handleAttack = useCallback(() => {
    const name = username.trim();
    if (!name) return;
    if (gameState.winner) return; // Không cho đánh khi game kết thúc

    const factionId = gameState.userFactions[name];
    if (!factionId) {
      alert('Bạn chưa chọn phe! Hãy bấm !1, !2, hoặc !3 trước.');
      return;
    }

    const dmg = 10;

    setGameState(prev => {
      if (prev.winner) return prev;
      const newHP = Math.max(0, prev.bossHP - dmg);

      // Kiểm tra Boss chết ngay lập tức (không chỉ qua game loop)
      if (newHP <= 0) {
        const winnerFactionId = Object.entries(prev.factions)
          .sort(([, a], [, b]) => b.damage - a.damage)[0][0];
        setTimeout(() => setGameState(createInitialState()), 5000);
        return {
          ...prev,
          bossHP: 0,
          winner: winnerFactionId,
          factions: {
            ...prev.factions,
            [factionId]: { damage: prev.factions[factionId].damage + dmg },
          },
        };
      }

      return {
        ...prev,
        bossHP: newHP,
        factions: {
          ...prev.factions,
          [factionId]: { damage: prev.factions[factionId].damage + dmg },
        },
      };
    });

    eventCountRef.current += 1;
    setLastEvent({
      type: 'attack',
      username: name,
      factionId,
      damage: dmg,
      text: `${name} đánh -${dmg} HP`,
      _id: eventCountRef.current,
    });
  }, [username, gameState.userFactions, gameState.winner]);

  // ────────────────────────────────────────────
  // ACTION: Tặng quà (Hoa Hồng / Sư Tử)
  // ────────────────────────────────────────────
  const handleGift = useCallback((giftKey) => {
    const name = username.trim();
    if (!name) return;
    if (gameState.winner) return;

    const factionId = gameState.userFactions[name];
    if (!factionId) {
      alert('Bạn chưa chọn phe! Hãy bấm !1, !2, hoặc !3 trước.');
      return;
    }

    const gift = GIFTS[giftKey];

    setGameState(prev => {
      if (prev.winner) return prev;
      return {
        ...prev,
        factions: {
          ...prev.factions,
          [factionId]: { damage: prev.factions[factionId].damage + gift.damage },
        },
      };
    });

    eventCountRef.current += 1;
    setLastEvent({
      type: 'gift',
      username: name,
      factionId,
      damage: gift.damage,
      giftName: gift.name,
      text: `${name} tặng ${gift.emoji}${gift.name} +${gift.damage}`,
      _id: eventCountRef.current,
    });
  }, [username, gameState.userFactions, gameState.winner]);

  // Phe hiện tại của user đang nhập
  const currentFaction = gameState.userFactions[username.trim()];
  const factionInfo = currentFaction ? FACTIONS[currentFaction] : null;

  // Tỉ lệ HP để hiển thị thanh máu
  const hpRatio = gameState.bossHP / BOSS_MAX_HP;
  const hpBarColor = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';

  return (
    <div style={css.page}>
      {/* ── TIÊU ĐỀ ── */}
      <h1 style={css.title}>⚔️ PHE PHÁI TRANH HÙNG ⚔️</h1>
      <p style={css.subtitle}>Giả lập TikTok Livestream • Chọn phe và chiến đấu!</p>

      {/* ── PIXI.JS GAME CANVAS ── */}
      <GameCanvas gameState={gameState} lastEvent={lastEvent} />

      {/* ── BẢNG ĐIỀU KHIỂN ── */}
      <div style={css.panel}>
        <div style={css.panelHeader}>
          🎮 Bảng Điều Khiển — Giả Lập TikTok Live Chat
        </div>

        {/* Nhập tên khán giả */}
        <div style={css.row}>
          <span style={css.label}>👤 Tên:</span>
          <input
            style={css.input}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Nhập tên khán giả..."
            maxLength={20}
          />
          {factionInfo && (
            <div style={{ ...css.factionBadge, background: factionInfo.colorHex }}>
              {factionInfo.icon} {factionInfo.name}
            </div>
          )}
        </div>

        {/* Chọn phe */}
        <div style={css.row}>
          <span style={css.label}>🏳️ Phe:</span>
          {Object.entries(FACTIONS).map(([id, faction]) => (
            <button
              key={id}
              onClick={() => handleJoinFaction(id)}
              style={{
                ...css.btn,
                background: faction.colorHex,
                boxShadow: currentFaction === id
                  ? `0 0 12px ${faction.colorHex}88`
                  : 'none',
                transform: currentFaction === id ? 'scale(1.05)' : 'scale(1)',
                opacity: gameState.winner ? 0.5 : 1,
              }}
              disabled={!!gameState.winner}
            >
              !{id} {faction.icon} {faction.name}
            </button>
          ))}
        </div>

        {/* Hành động chiến đấu */}
        <div style={css.row}>
          <span style={css.label}>⚡ Lệnh:</span>
          <button
            onClick={handleAttack}
            style={{ ...css.btn, background: '#dc2626', fontSize: '14px' }}
            disabled={!!gameState.winner}
          >
            ⚔️ Đánh Boss (!danh) −10 HP
          </button>
          <button
            onClick={() => handleGift('rose')}
            style={{ ...css.btn, background: '#db2777' }}
            disabled={!!gameState.winner}
          >
            🌹 Hoa Hồng (+100)
          </button>
          <button
            onClick={() => handleGift('lion')}
            style={{ ...css.btn, background: '#ea580c' }}
            disabled={!!gameState.winner}
          >
            🦁 Sư Tử (+1000)
          </button>
        </div>

        {/* Bảng điểm 3 phe */}
        <div style={css.scoreRow}>
          {Object.entries(FACTIONS).map(([id, faction]) => {
            const dmg = gameState.factions[id].damage;
            const isWinner = gameState.winner === id;
            return (
              <div
                key={id}
                style={{
                  ...css.scoreCard,
                  borderColor: faction.colorHex,
                  background: isWinner ? faction.colorHex + '22' : '#0a0a1a',
                  boxShadow: isWinner ? `0 0 20px ${faction.colorHex}66` : 'none',
                }}
              >
                <div style={{ color: faction.colorHex, fontSize: '15px', fontWeight: 'bold' }}>
                  {faction.icon} {faction.name}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', margin: '4px 0' }}>
                  {dmg.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>DAMAGE</div>
                {isWinner && (
                  <div style={{ color: '#ffd700', fontSize: '13px', marginTop: '4px' }}>
                    🏆 CHIẾN THẮNG!
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mini HP Bar trong panel */}
        <div style={css.miniHPRow}>
          <span style={{ ...css.label, minWidth: '70px' }}>👹 Boss:</span>
          <div style={css.miniHPBg}>
            <div
              style={{
                ...css.miniHPFill,
                width: `${hpRatio * 100}%`,
                background: hpBarColor,
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '120px', textAlign: 'right' }}>
            {gameState.bossHP.toLocaleString()} / {BOSS_MAX_HP.toLocaleString()} HP
          </span>
        </div>

        {/* Log sự kiện cuối */}
        {lastEvent && (
          <div style={css.eventLog}>
            📢 &nbsp;<strong>{lastEvent.text}</strong>
          </div>
        )}

        {/* Hướng dẫn */}
        <div style={css.guide}>
          <strong>Cách chơi:</strong> Nhập tên → Chọn phe (!1/!2/!3) → Đánh boss hoặc tặng quà.
          Boss mất HP tự động theo tổng damage tích lũy (200 damage = 1 HP/giây).
        </div>
      </div>
    </div>
  );
}

// ── Inline styles ──
const css = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0a0a1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    gap: '16px',
  },
  title: {
    fontSize: '30px',
    fontWeight: '900',
    color: '#fbbf24',
    textShadow: '0 0 30px rgba(251,191,36,0.6), 0 2px 4px #000',
    letterSpacing: '2px',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },
  panel: {
    backgroundColor: '#111128',
    border: '1px solid #2d2d5e',
    borderRadius: '14px',
    padding: '18px',
    width: '100%',
    maxWidth: '870px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  panelHeader: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#a78bfa',
    borderBottom: '1px solid #2d2d5e',
    paddingBottom: '10px',
    marginBottom: '2px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '13px',
    color: '#94a3b8',
    minWidth: '55px',
    flexShrink: 0,
  },
  input: {
    backgroundColor: '#0a0a1a',
    border: '1px solid #3b3b6b',
    borderRadius: '8px',
    color: '#e2e8f0',
    padding: '7px 12px',
    fontSize: '14px',
    width: '160px',
    outline: 'none',
  },
  factionBadge: {
    borderRadius: '8px',
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#fff',
  },
  btn: {
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  scoreRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  scoreCard: {
    border: '2px solid',
    borderRadius: '10px',
    padding: '10px 20px',
    textAlign: 'center',
    flex: '1',
    minWidth: '120px',
    transition: 'all 0.3s ease',
  },
  miniHPRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  miniHPBg: {
    flex: 1,
    height: '12px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #2d2d5e',
  },
  miniHPFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.5s ease, background 0.5s ease',
  },
  eventLog: {
    backgroundColor: '#0a0a1a',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#fbbf24',
    borderLeft: '4px solid #fbbf24',
  },
  guide: {
    fontSize: '12px',
    color: '#475569',
    backgroundColor: '#0a0a1a',
    borderRadius: '8px',
    padding: '10px 14px',
    lineHeight: '1.6',
  },
};
