import React, { useState, useCallback, useRef } from 'react'
import GameCanvas from './GameCanvas.jsx'
import { BOSS_MAX_HP, FACTIONS, RANKS, LOOT_TABLE, createInitialState } from './mockData.js'
import { AudioManager } from './AudioManager.js'

export default function App() {
  const [gameState, setGameState] = useState(createInitialState());
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  // Thêm frags (mảnh) và equip (cấp trang bị)
  const [player, setPlayer] = useState({
    name: 'Khán giả 1', factionId: '1', rankLevel: 0,
    thanhChi: 0, thanhChiManh: 0, chests: 1,
    frags: { sword: 0, armor: 0, horse: 0 }, // Mảnh
    equip: { sword: 0, armor: 0, horse: 0 }, // Cấp trang bị (0, 1, 2...)
    buffDmgUntil: 0, buffSpeedUntil: 0,
  });
  
  const [lastEvent, setLastEvent] = useState(null);
  const [isHit, setIsHit] = useState(false); // Kích hoạt hiệu ứng rung Boss 3D
  const eventCountRef = useRef(0);
  
  const triggerEvent = (eventData) => {
    eventCountRef.current += 1;
    setLastEvent({ ...eventData, _id: eventCountRef.current });
  };

  // Logic Đánh Boss
  const handleAttack = useCallback(() => {
    if (gameState.winner || !player.factionId) return;
    
    // Kích hoạt rung Boss
    setIsHit(true);
    setTimeout(() => setIsHit(false), 200);

    const now = Date.now();
    const rankData = RANKS[player.rankLevel];
    // Sát thương = Gốc + Rank + Trang bị Gươm (Mỗi cấp +50 DMG)
    let baseDmg = 10 + rankData.dmgBuff + (player.equip.sword * 50);
    if (player.buffDmgUntil > now) baseDmg *= 2;
    
    // Tốc độ đánh = Rank Speed + Ngựa (Mỗi cấp +10%)
    const totalSpeed = rankData.speedBuff + (player.equip.horse * 0.1);
    const dmg = Math.floor(baseDmg * totalSpeed);

    setGameState(prev => {
      const newHP = Math.max(0, prev.bossHP - dmg);
      if (newHP <= 0 && !prev.winner) {
         const winnerFactionId = Object.entries(prev.factions).sort(([, a], [, b]) => b.damage - a.damage)[0][0];
         setTimeout(() => setGameState(createInitialState()), 5000);
         return { ...prev, bossHP: 0, winner: winnerFactionId, factions: { ...prev.factions, [player.factionId]: { damage: prev.factions[player.factionId].damage + dmg } } };
      }
      return { ...prev, bossHP: newHP, factions: { ...prev.factions, [player.factionId]: { damage: prev.factions[player.factionId].damage + dmg } } };
    });

    // Tỷ lệ rớt rương: Cơ bản 20% + Giáp (Mỗi cấp +5%)
    const dropRate = 0.2 + (player.equip.armor * 0.05);
    if (Math.random() < dropRate) {
      setPlayer(p => ({ ...p, chests: p.chests + 1 }));
      AudioManager.speak("Bạn vừa nhặt được một rương chiến công!");
    }

    triggerEvent({ type: 'attack', text: `${player.name} đánh -${dmg} HP` });
  }, [gameState.winner, player]);

  // Logic Mở Rương & Ghép Trang Bị
  const handleOpenChest = () => {
    if (player.chests <= 0) return;
    
    setPlayer(p => {
      let pCopy = { ...p, chests: p.chests - 1 };
      
      const rand = Math.random() * 100;
      let currentChance = 0;
      let loot = LOOT_TABLE[0];
      for (const item of LOOT_TABLE) {
        currentChance += item.chance;
        if (rand <= currentChance) { loot = item; break; }
      }

      let speechText = `Chúc mừng ${p.name} nhận được ${loot.name}!`;
      
      // Xử lý nhận đồ
      if (loot.type === 'frag_sword' || loot.type === 'frag_armor' || loot.type === 'frag_horse') {
        const key = loot.type.replace('frag_', ''); // 'sword', 'armor', 'horse'
        pCopy.frags[key] += 1;
        
        // Tự động ghép khi đủ 3 mảnh
        if (pCopy.frags[key] >= 3) {
          pCopy.frags[key] -= 3;
          pCopy.equip[key] += 1;
          speechText = `Tuyệt vời! ${p.name} đã ghép 3 mảnh thành công, nâng cấp ${loot.name.replace('Mảnh ', '')} lên cấp ${pCopy.equip[key]}!`;
        }
      }
      
      if (loot.type === 'thanhchi_manh') {
        pCopy.thanhChiManh += 1;
        if (pCopy.thanhChiManh >= 5) {
          pCopy.thanhChiManh -= 5;
          pCopy.thanhChi += 1;
          speechText = `Chúc mừng ${p.name} đã ghép đủ 5 mảnh và nhận được 1 Thánh Chỉ!`;
        }
      }
      if (loot.type === 'thanhchi') pCopy.thanhChi += 1;
      if (loot.type === 'buff_dmg') pCopy.buffDmgUntil = Date.now() + 60000;
      if (loot.type === 'buff_speed') pCopy.buffSpeedUntil = Date.now() + 60000;
      if (loot.type === 'jackpot') {
        pCopy.thanhChi += 1; 
        pCopy.buffDmgUntil = Date.now() + 60000;
        pCopy.equip.sword += 1; pCopy.equip.armor += 1; pCopy.equip.horse += 1; // Thưởng luôn cấp đồ
        speechText = `JACKPOT! Chúc mừng ${p.name} nhận được Thánh Chỉ và nâng cấp toàn bộ trang bị!`;
      }

      AudioManager.speak(speechText);
      triggerEvent({ type: 'gift', text: `MỞ RƯƠNG: ${loot.name}` });
      
      return pCopy;
    });
  };

  // Logic Donate
  const handleDonate = (type) => {
    const isLion = type === 'lion';
    const chestReward = isLion ? 3 : 1;
    const buffTime = isLion ? 30000 : 10000;
    
    setPlayer(p => ({
      ...p,
      chests: p.chests + chestReward,
      buffDmgUntil: Date.now() + buffTime
    }));

    AudioManager.speak(isLion 
      ? `Cảm ơn đại gia ${player.name} đã tặng Sư Tử! Toàn bộ phe được buff sức mạnh!` 
      : `Cảm ơn ${player.name} đã tặng Hoa Hồng!`
    );

    triggerEvent({ type: 'gift', text: `${player.name} đã donate ${isLion ? '🦁 Sư Tử' : '🌹 Hoa Hồng'}!` });
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
      
      <GameCanvas gameState={gameState} lastEvent={lastEvent} player={player} isHit={isHit} />

      <div style={{ 
        marginTop: '15px', background: 'linear-gradient(to bottom, #2d1c15, #1a120c)', 
        padding: '15px', borderRadius: '10px', width: '100%', maxWidth: '860px', 
        border: '2px solid #d4af37', boxShadow: '0 0 15px rgba(0,0,0,0.8)' 
      }}>
        
        {/* THÔNG TIN PLAYER & TRANG BỊ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d4af37', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '16px' }}>
            <span style={{ color: currentRank.color, fontWeight: 'bold' }}>[{currentRank.name}]</span> {player.name}
            <div style={{ marginTop: '5px', fontSize: '13px', color: '#cbd5e1' }}>
              🗡️ Gươm Lv.{player.equip.sword} (Mảnh: {player.frags.sword}/3) | 
              🛡️ Giáp Lv.{player.equip.armor} (Mảnh: {player.frags.armor}/3) | 
              🐎 Ngựa Lv.{player.equip.horse} (Mảnh: {player.frags.horse}/3)
            </div>
          </div>
          <div style={{ fontSize: '15px', textAlign: 'right' }}>
            🎒 Rương: <strong style={{color: '#fbbf24'}}>{player.chests}</strong><br/>
            📜 Thánh chỉ: <strong style={{color: '#c084fc'}}>{player.thanhChi}</strong> (Mảnh: {player.thanhChiManh}/5)
          </div>
        </div>

        {/* NÚT BẤM */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button onClick={handleAttack} style={{...cssBtn, background: 'linear-gradient(to bottom, #dc2626, #991b1b)'}}>⚔️ Đánh Boss</button>
          <button onClick={() => setPlayer(p => ({...p, chests: p.chests + 5}))} style={{...cssBtn, background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)'}}>📦 Thêm 5 Rương (Test)</button>
          <button onClick={handleOpenChest} style={{...cssBtn, background: 'linear-gradient(to bottom, #f59e0b, #b45309)', opacity: player.chests > 0 ? 1 : 0.5}} disabled={player.chests <= 0}>🎁 Mở Rương ({player.chests})</button>
          <button onClick={handleUpRank} style={{...cssBtn, background: 'linear-gradient(to bottom, #8b5cf6, #5b21b6)'}}>⬆️ Thăng Chức ({RANKS[player.rankLevel + 1]?.cost || 'MAX'} TC)</button>
        </div>

        {/* KHU VỰC DONATE */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #d4af37', paddingTop: '15px' }}>
          <button onClick={() => handleDonate('rose')} style={{...cssBtn, background: 'linear-gradient(to bottom, #ec4899, #be185d)'}}>🌹 Donate Hoa Hồng (+1 Rương, x2 DMG 10s)</button>
          <button onClick={() => handleDonate('lion')} style={{...cssBtn, background: 'linear-gradient(to bottom, #f97316, #c2410c)'}}>🦁 Donate Sư Tử (+3 Rương, x2 DMG 30s)</button>
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
  color: '#fff', fontWeight: 'bold', cursor: 'pointer', flex: 1, minWidth: '150px',
  textShadow: '1px 1px 2px #000', boxShadow: '0 4px 6px rgba(0,0,0,0.5)', transition: 'all 0.2s'
};
