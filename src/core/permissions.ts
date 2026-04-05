/**
 * Player permission levels.
 * S: Superuser (OP) - All commands allowed.
 * A: Advanced - Coordinate teleportation allowed.
 * B: Basic - Weather change and player teleportation allowed.
 * C: Casual - Only chat and questions allowed.
 */
export type PermissionLevel = 'S' | 'A' | 'B' | 'C';

export interface PermissionDefinition {
    level: PermissionLevel;
    description: string;
    allowedCapabilities: string[];
}

export const PERMISSION_DEFINITIONS: Record<PermissionLevel, PermissionDefinition> = {
    S: {
        level: 'S',
        description: '管理员/OP - 拥有所有权限，无视限制喵~',
        allowedCapabilities: ['*'],
    },
    A: {
        level: 'A',
        description: '核心成员 - 可以申请坐标传送，呐~',
        allowedCapabilities: ['teleport_coords'],
    },
    B: {
        level: 'B',
        description: '正式玩家 - 可以改天气和玩家间传送，哼~',
        allowedCapabilities: ['change_weather', 'teleport_players'],
    },
    C: {
        level: 'C',
        description: '普通访客 - 只能聊天和问问题，不许乱动喵！',
        allowedCapabilities: [],
    },
};

/**
 * Check if a permission level has a specific capability.
 */
export function hasCapability(level: PermissionLevel, capability: string): boolean {
    if (level === 'S') return true;
    const def = PERMISSION_DEFINITIONS[level];
    if (!def) return false;
    return def.allowedCapabilities.includes(capability);
}
