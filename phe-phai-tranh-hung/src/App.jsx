import React, { useState, useEffect, useCallback, useRef } from 'react'
import GameCanvas from './GameCanvas.jsx'
import { BOSS_MAX_HP, FACTIONS, GIFTS, RANKS, LOOT_TABLE, createInitialState } from './mockData.js'
import { AudioManager } from './AudioManager.js'

export default function App() {
  const [gameState, setGameState] = useState(createInitialState());
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  // State của người chơi hiện tại (Mock 1 người)
  const [player, setPlayer] = useState({
    name: 'Khán giả 1',
    factionId: '1',
    rankLevel: 0,
    thanhChi: 0,
    thanhChiManh: 0,
    chests: 1, // Bắt đầu với 1 rương để test
    buffDmgUntil: 0, // Timestamp hết hạn
    buffSpeedUntil: 0,
  });

  const [lastEvent, setLastEvent] = useState(null);
  const eventCountRef = useRef(0);
  
  // Hàm tạo event trigger hiệu ứng
  const triggerEvent = (eventData) => {
    eventCountRef.current += 1;
    setLastEvent({ ...eventData, _id: eventCountRef.current });
  };

  // Logic đánh Boss
  const handleAttack = useCallback(() => {
    if (gameState.winner || !player.factionId) return;
    
    const now = Date.now();
    const hasSpeedBuff = player.buffSpeedUntil > now;
    const rankData = RANKS[player.rankLevel];
    
    // Tính sát thương (Gốc 10 + Buff Rank + Buff Item)
    let baseDmg = 10 + rankData.dmgBuff;
    if (player.buffDmgUntil > now) baseDmg *= 2;
    
    const dmg = Math.floor(baseDmg * rankData.speedBuff * (hasSpeedBuff ? 2 : 1)); // Nhân thêm speed buff vào dmg để dễ test

    setGameState(prev => {
      const newHP = Math.max(0, prev.bossHP - dmg);
      if (newHP <= 0 && !prev.winner) {
         // Logic chọn người thắng (tạm thời gán phe có dmg cao nhất)
         const winnerFactionId = Object.entries(prev.factions).sort(([, a], [, b]) => b.damage - a.damage)[0][0];
         setTimeout(() => setGameState(createInitialState()), 5000);
         return { ...prev, bossHP: 0, winner: winnerFactionId, factions: { ...prev.factions, [player.factionId]: { damage: prev.factions[player.factionId].damage + dmg } } };
      }
      return {
        ...prev,
        bossHP: newHP,
        factions: { ...prev.factions, [player.factionId]: { damage: prev.factions[player.factionId].damage + dmg } },
      };
    });

    // 20% tỷ lệ rớt rương khi đánh
    let dropChest = false;
    if (Math.random() < 0.2) {
      dropChest = true;
      setPlayer(p => ({ ...p, chests: p.chests + 1 }));
      AudioManager.speak("Bạn vừa nhặt được một rương chiến công!");
    }

    triggerEvent({ type: 'attack', text: `${player.name} đánh -${dmg} HP ${dropChest ? '(Rớt Rương!)' : ''}`, damage: dmg });
  }, [gameState.winner, player]);

  // Logic mở rương
  const handleOpenChest = () => {
    if (player.chests <= 0) return alert('Bạn không có rương nào!');
    
    setPlayer(p => ({ ...p, chests: p.chests - 1 }));
    
    // Random loot
    const rand = Math.random() * 100;
    let currentChance = 0;
    let loot = LOOT_TABLE[0];
    for (const item of LOOT_TABLE) {
      currentChance += item.chance;
      if (rand <= currentChance) { loot = item; break; }
    }

    let speechText = `Chúc mừng ${player.name} nhận được ${loot.name}!`;
    let newRankLevel = player.rankLevel;
    
    setPlayer(p => {
      const pCopy = { ...p };
      if (loot.type === 'thanhchi_manh') pCopy.thanhChiManh += 1;
      if (loot.type === 'thanhchi') pCopy.thanhChi += 1;
      if (loot.type === 'buff_dmg') pCopy.buffDmgUntil = Date.now() + 60000;
      if (loot.type === 'buff_speed') pCopy.buffSpeedUntil = Date.now() + 60000;
      if (loot.type === 'jackpot') {
        pCopy.thanhChi += 1;
        pCopy.buffDmgUntil = Date.now() + 60000;
        speechText = `JACKPOT! Chúc mừng ${p.name} nhận được Thánh Chỉ và Bùa Sức Mạnh!`;
      }
      return pCopy;
    });

    AudioManager.speak(speechText);
    triggerEvent({ type: 'gift', text: `MỞ RƯƠNG: ${loot.name}`, damage: 0 });
  };

  // Logic thăng chức
  const handleUpRank = () => {
    const nextRank = RANKS[player.rankLevel + 1];
    if (!nextRank) return alert('Bạn đã đạt cấp bậc cao nhất!');
    if (player.thanhChi < nextRank.cost) return alert(`Bạn cần ${nextRank.cost} Thánh Chỉ để thăng chức!`);

    setPlayer(p => ({ ...p, thanhChi: p.thanhChi - nextRank.cost, rankLevel: p.rankLevel + 1 }));
    AudioManager.speak(`Thăng chức! ${player.name} đã trở thành ${nextRank.name}!`);
    triggerEvent({ type: 'gift', text: `THĂNG CHỨC: ${nextRank.name}`, damage: 0 });
  };

  const currentRank = RANKS[player.rankLevel];

  if (!isGameStarted) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0a0a1a', color: '#fff' }}>
        <h1 style={{ fontSize: '40px', color: '#fbbf24', textShadow: '0 0 20px #fbbf24' }}>⚔️ PHE PHÁI TRANH HÙNG ⚔️</h1>
        <button 
          onClick={() => { setIsGameStarted(true); AudioManager.speak("Trận chiến bắt đầu!"); }}
          style={{ marginTop: '30px', padding: '15px 40px', fontSize: '20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          BẮT ĐẦU TRẬN CHIẾN
        </button>
        <p style={{ marginTop: '20px', color: '#94a3b8' }}>(Nhấn nút để bật âm thanh và giọng đọc)</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0a0a1a', minHeight: '100vh', color: '#fff' }}>
      
      {/* GAME CANVAS */}
      <GameCanvas gameState={gameState} lastEvent={lastEvent} player={player} />

      {/* BẢNG ĐIỀU KHIỂN */}
      <div style={{ marginTop: '15px', background: '#1e293b', padding: '15px', borderRadius: '10px', width: '860px', border: '1px solid #334155' }}>
        
        {/* THÔNG TIN PLAYER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}>
          <div>
            <span style={{ color: currentRank.color, fontWeight: 'bold', fontSize: '18px' }}>[{currentRank.name}]</span> {player.name}
          </div>
          <div>
            🎒 Rương: <strong>{player.chests}</strong> | 📜 Thánh chỉ: <strong>{player.thanhChi}</strong> (Mảnh: {player.thanhChiManh}/5)
          </div>
        </div>

        {/* NÚT BẤM HÀNH ĐỘNG */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleAttack} style={{...cssBtn, background: '#dc2626'}}>⚔️ Đánh Boss (!danh)</button>
          <button onClick={() => setPlayer(p => ({...p, chests: p.chests + 1}))} style={{...cssBtn, background: '#3b82f6'}}>📦 Thêm Rương (Test)</button>
          <button onClick={handleOpenChest} style={{...cssBtn, background: '#f59e0b'}} disabled={player.chests <= 0}>🎁 Mở Rương ({player.chests})</button>
          <button onClick={handleUpRank} style={{...cssBtn, background: '#8b5cf6'}}>⬆️ Thăng Chức ({RANKS[player.rankLevel + 1]?.cost || 'MAX'} TC)</button>
        </div>

        {/* BUFF STATUS */}
        <div style={{ marginTop: '10px', fontSize: '13px', color: '#94a3b8' }}>
          Buffs: 
          {player.buffDmgUntil > Date.now() ? <span style={{color: '#ef4444', marginLeft: '5px'}}>🔥 x2 DMG (Còn {Math.ceil((player.buffDmgUntil - Date.now())/1000)}s)</span> : ' Không'}
          {player.buffSpeedUntil > Date.now() ? <span style={{color: '#10b981', marginLeft: '10px'}}>💨 x2 Speed (Còn {Math.ceil((player.buffSpeedUntil - Date.now())/1000)}s)</span> : ''}
        </div>
      </div>
    </div>
  );
}

const cssBtn = {
  padding: '10px 15px', border: 'none', borderRadius: '5px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', flex: 1
};
