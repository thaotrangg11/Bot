export const BOSS_MAX_HP = 50000;

export const FACTIONS = {
  '1': { id: '1', name: 'Lê Lợi', colorHex: '#3b82f6', pixiColor: 0x3b82f6, bgColor: 0x1e293b, icon: '🛡️' },
  '2': { id: '2', name: 'Quang Trung', colorHex: '#f59e0b', pixiColor: 0xf59e0b, bgColor: 0x451a03, icon: '⚡' },
  '3': { id: '3', name: 'Trần Hưng Đạo', colorHex: '#8b5cf6', pixiColor: 0x8b5cf6, bgColor: 0x2e1065, icon: '⚔️' },
};

export const RANKS = [
  { level: 0, name: 'Dân Thường', color: '#ffffff', cost: 0, dmgBuff: 0, speedBuff: 1 },
  { level: 1, name: 'Lính Mới', color: '#d1d5db', cost: 1, dmgBuff: 5, speedBuff: 1.1 },
  { level: 2, name: 'Đội Trưởng', color: '#22c55e', cost: 3, dmgBuff: 20, speedBuff: 1.2 },
  { level: 3, name: 'Tiên Phong', color: '#3b82f6', cost: 6, dmgBuff: 50, speedBuff: 1.3 },
  { level: 4, name: 'Thiên Hộ', color: '#a855f7', cost: 12, dmgBuff: 150, speedBuff: 1.4 },
  { level: 5, name: 'Tướng Quân', color: '#ef4444', cost: 25, dmgBuff: 500, speedBuff: 1.6 },
  { level: 6, name: 'Thượng Tướng', color: '#f97316', cost: 50, dmgBuff: 1500, speedBuff: 1.8 },
  { level: 7, name: 'Đại Nguyên Soái', color: '#fbbf24', cost: 100, dmgBuff: 5000, speedBuff: 2.5 },
];

// Tỷ lệ rớt đồ (Thêm Mảnh Trang Bị)
export const LOOT_TABLE = [
  { type: 'frag_sword', name: 'Mảnh Gươm', chance: 25, color: '#f87171' },
  { type: 'frag_armor', name: 'Mảnh Giáp', chance: 20, color: '#60a5fa' },
  { type: 'frag_horse', name: 'Mảnh Ngựa', chance: 15, color: '#34d399' },
  { type: 'thanhchi_manh', name: 'Mảnh Thánh Chỉ', chance: 20, color: '#c084fc' },
  { type: 'thanhchi', name: 'Thánh Chỉ', chance: 5, color: '#fbbf24' },
  { type: 'buff_dmg', name: 'Bùa Sức Mạnh', chance: 10, color: '#ef4444' },
  { type: 'buff_speed', name: 'Bùa Tốc Độ', chance: 4, color: '#10b981' },
  { type: 'jackpot', name: 'JACKPOT!', chance: 1, color: '#fbbf24' },
];

export const createInitialState = () => ({
  bossHP: BOSS_MAX_HP,
  factions: { '1': { damage: 0 }, '2': { damage: 0 }, '3': { damage: 0 } },
  winner: null,
});
