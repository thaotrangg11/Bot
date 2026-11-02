// ============================================================
// MOCK DATA — Dữ liệu giả lập cho game Phe Phái Tranh Hùng
// Thay thế TikTok API bằng dữ liệu tĩnh để demo
// ============================================================

// Máu tối đa của Boss
export const BOSS_MAX_HP = 10000;

// Cấu hình 3 phe phái
export const FACTIONS = {
  '1': {
    id: '1',
    name: 'Lê Lợi',
    colorHex: '#3b82f6',     // Màu xanh dương (CSS)
    pixiColor: 0x3b82f6,     // Màu xanh dương (Pixi.js hex)
    bgColor: 0x0d2240,       // Màu nền khu vực (tối hơn)
    borderColor: 0x3b82f6,
    icon: '🛡️',
    label: 'XANH',
  },
  '2': {
    id: '2',
    name: 'Quang Trung',
    colorHex: '#f59e0b',     // Màu vàng (CSS)
    pixiColor: 0xf59e0b,     // Màu vàng (Pixi.js hex)
    bgColor: 0x2a1d00,
    borderColor: 0xf59e0b,
    icon: '⚡',
    label: 'VÀNG',
  },
  '3': {
    id: '3',
    name: 'Trần Hưng Đạo',
    colorHex: '#8b5cf6',     // Màu tím (CSS)
    pixiColor: 0x8b5cf6,     // Màu tím (Pixi.js hex)
    bgColor: 0x1a0d3d,
    borderColor: 0x8b5cf6,
    icon: '⚔️',
    label: 'TÍM',
  },
};

// Cấu hình quà tặng
export const GIFTS = {
  rose: {
    key: 'rose',
    name: 'Hoa Hồng',
    damage: 100,
    emoji: '🌹',
    color: '#ec4899',
  },
  lion: {
    key: 'lion',
    name: 'Sư Tử',
    damage: 1000,
    emoji: '🦁',
    color: '#f97316',
  },
};

// Hàm tạo state ban đầu (dùng cho reset)
export const createInitialState = () => ({
  bossHP: BOSS_MAX_HP,
  factions: {
    '1': { damage: 0 },
    '2': { damage: 0 },
    '3': { damage: 0 },
  },
  winner: null,        // factionId của phe thắng, hoặc null
  userFactions: {},    // { 'TênUser': 'factionId' }
});
