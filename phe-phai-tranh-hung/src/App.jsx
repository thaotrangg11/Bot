import React, { useState, useEffect, useCallback, useRef } from 'react'
import GameCanvas from './GameCanvas.jsx'
import { BOSS_MAX_HP, FACTIONS, GIFTS, RANKS, LOOT_TABLE, createInitialState } from './mockData.js'
import { AudioManager } from './AudioManager.js'

export default function App() {
  const [gameState, setGameState] = useState(createInitialState());
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [player, setPlayer] = useState({
    name: 'Khán giả 1', factionId: '1', rankLevel: 0,
    thanhChi: 0, thanhChiManh: 0, chests: 1,
    buffDmgUntil: 0, buffSpeedUntil: 0,
  });
  const [lastEvent, setLastEvent] = useState(null);
  const eventCountRef = useRef(0);
  
  const triggerEvent = (eventData) => {
    eventCountRef.current += 1;
    setLastEvent({ ...eventData, _id: eventCountRef.current });
  };

  const handleAttack = useCallback(() => {
    if (gameState.winner || !player.factionId) return;
    const now = Date.now();
    const rankData = RANKS[player.rankLevel];
    let baseDmg = 10 + rankData.dmgBuff;
    if (player.buffDmgUntil > now) baseDmg *= 2;
    const dmg = Math.floor(baseDmg * rankData.speedBuff * (player.buffSpeedUntil > now ? 1.5 : 1));

    setGameState(prev => {
      const newHP = Math.max(0, prev.bossHP - dmg);
      if (newHP <= 0 && !prev.winner) {
         const winnerFactionId = Object.entries(prev.factions).sort(([, a], [, b]) => b.damage - a.damage)[0][0];
         setTimeout(() => setGameState(createInitialState()), 5000);
         return { ...prev, bossHP: 0, winner: winnerFactionId, factions: { ...prev.factions, [player.factionId]: { damage: prev.factions[player.factionId].damage + dmg } } };
      }
      return { ...prev, bossHP: newHP, factions: { ...prev.factions, [player.factionId]: { damage: prev.factions[player.factionId].damage + dmg } } };
    });

    let dropChest = Math.random() < 0.2;
    if (dropChest) {
      setPlayer(p => ({ ...p, chests: p.chests + 1 }));
      AudioManager.speak("Bạn vừa nhặt được một rương chiến công!");
    }
    triggerEvent({ type: 'attack', text: `${player.name} đánh -${dmg} HP ${dropChest ? '(Rớt Rương!)' : ''}` });
  }, [gameState.winner, player]);

  const handleOpenChest = () => {
    if (player.chests <= 0) return alert('Bạn không có rương nào!');
    setPlayer(p => ({ ...p, chests: p.chests - 1 }));
    
    const rand = Math.random() * 100;
    let currentChance = 0;
    let loot = LOOT_TABLE[0];
    for (const item of LOOT_TABLE) {
      currentChance += item.chance;
      if (rand <= currentChance) { loot = item; break; }
    }

    let speechText = `Chúc mừng ${player.name} nhận được ${loot.name}!`;
    
    setPlayer(p => {
      const pCopy = { ...p };
      if (loot.type === 'thanhchi_manh') pCopy.thanhChiManh += 1;
      if (loot.type === 'thanhchi') pCopy.thanhChi += 1;
      if (loot.type === 'buff_dmg') pCopy.buffDmgUntil = Date.now() + 60000;
      if (loot.type === 'buff_speed') pCopy.buffSpeedUntil = Date.now() + 60000;
      if (loot.type === 'jackpot') {
        pCopy.thanhChi += 1; pCopy.buffDmgUntil = Date.now() + 60000;
        speechText = `JACKPOT! Chúc mừng ${p.name} nhận được Thánh Chỉ và Bùa Sức Mạnh!`;
      }
      return pCopy;
    });

    AudioManager.speak(speechText);
    triggerEvent({ type: 'gift', text: `MỞ RƯƠNG: ${loot.name}` });
  };

  const handleUpRank = () => {
    const nextRank = RANKS[player.rankLevel + 1];
    if (!nextRank) return alert('Bạn đã đạt cấp bậc cao nhất!');
    if (player.thanhChi < nextRank.cost) return alert(`Bạn cần ${nextRank.cost} Thánh Chỉ!`);

    setPlayer(p => ({ ...p, thanhChi: p.thanhChi - nextRank.cost, rankLevel: p.rankLevel + 1 }));
    AudioManager.speak(`Thăng chức! ${player.name} đã trở thành ${nextRank.name}!`);
    triggerEvent({ type: 'gift', text: `THĂNG CHỨC: ${nextRank.name}` });
  };

  const currentRank = RANKS[player.rankLevel];

  if (!isGameStarted) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#1a120c', color: '#d4af37' }}>
        <h1 style={{ fontSize: '40px', textShadow: '0 0 20px rgba(212,175,55,0.5)', fontFamily: 'serif' }}>⚔️ PHE PHÁI TRANH HÙNG ⚔️</h1>
        <button 
          onClick={() => { setIsGameStarted(true); AudioManager.speak("Trận chiến bắt đầu!"); }}
          style={{ marginTop: '30px', padding: '15px 40px', fontSize: '20px', background: '#8b0000', color: '#fff', border: '2px solid #d4af37', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          BẮT ĐẦU TRẬN CHIẾN
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#1a120c', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <GameCanvas gameState={gameState} lastEvent={lastEvent} player={player} />

      {/* BẢNG ĐIỀU KHIỂN GỖ CỔ PHONG */}
      <div style={{ 
        marginTop: '15px', background: 'linear-gradient(to bottom, #2d1c15, #1a120c)', 
        padding: '15px', borderRadius: '10px', width: '100%', maxWidth: '860px', 
        border: '2px solid #d4af37', boxShadow: '0 0 15px rgba(0,0,0,0.8)' 
      }}>
        
        {/* HEADER PLAYER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d4af37', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '16px' }}>
            <span style={{ color: currentRank.color, fontWeight: 'bold' }}>[{currentRank.name}]</span> {player.name}
          </div>
          <div style={{ fontSize: '15px' }}>
            🎒 Rương: <strong style={{color: '#fbbf24'}}>{player.chests}</strong> | 📜 Thánh chỉ: <strong style={{color: '#c084fc'}}>{player.thanhChi}</strong> (Mảnh: {player.thanhChiManh}/5)
          </div>
        </div>

        {/* NÚT BẤM */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleAttack} style={{...cssBtn, background: 'linear-gradient(to bottom, #dc2626, #991b1b)'}}>⚔️ Đánh Boss</button>
          <button onClick={() => setPlayer(p => ({...p, chests: p.chests + 1}))} style={{...cssBtn, background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)'}}>📦 Thêm Rương (Test)</button>
          <button onClick={handleOpenChest} style={{...cssBtn, background: 'linear-gradient(to bottom, #f59e0b, #b45309)'}} disabled={player.chests <= 0}>🎁 Mở Rương ({player.chests})</button>
          <button onClick={handleUpRank} style={{...cssBtn, background: 'linear-gradient(to bottom, #8b5cf6, #5b21b6)'}}>⬆️ Thăng Chức ({RANKS[player.rankLevel + 1]?.cost || 'MAX'} TC)</button>
        </div>

        {/* BUFF STATUS */}
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#d4af37', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <span>Trạng thái:</span>
          {player.buffDmgUntil > Date.now() ? <span style={{color: '#ef4444'}}>🔥 x2 DMG (Còn {Math.ceil((player.buffDmgUntil - Date.now())/1000)}s)</span> : <span style={{color: '#666'}}>Không Buff DMG</span>}
          {player.buffSpeedUntil > Date.now() ? <span style={{color: '#10b981'}}>💨 x2 Speed (Còn {Math.ceil((player.buffSpeedUntil - Date.now())/1000)}s)</span> : <span style={{color: '#666'}}>Không Buff Speed</span>}
        </div>
      </div>
    </div>
  );
}

const cssBtn = {
  padding: '12px 15px', border: '1px solid #d4af37', borderRadius: '5px', 
  color: '#fff', fontWeight: 'bold', cursor: 'pointer', flex: 1, minWidth: '120px',
  textShadow: '1px 1px 2px #000', boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
};
