import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { PermissionLevel } from './permissions.js';

export interface PermissionTable {
    [playerName: string]: PermissionLevel;
}

export class PermissionManager {
    private permissionPath: string;
    private opsPath: string;
    private permissions: PermissionTable = {};

    constructor() {
        this.permissionPath = path.join(config.mcServerPath, 'permissions.json');
        this.opsPath = path.join(config.mcServerPath, 'ops.json');
    }

    /**
     * Load permissions from config file.
     */
    public async loadPermissions(): Promise<void> {
        // 1. 加载自定义权限表
        try {
            const content = await fs.readFile(this.permissionPath, 'utf-8');
            this.permissions = JSON.parse(content);
        } catch (error: any) {
            if (error.code !== 'ENOENT') console.error(`[PermissionManager] 加载 permissions.json 出错:`, error);
        }

        // 2. 加载 OP 列表并自动赋予 S 级
        try {
            const opsContent = await fs.readFile(this.opsPath, 'utf-8');
            const ops: any[] = JSON.parse(opsContent);
            ops.forEach(op => {
                if (op.name) {
                    this.permissions[op.name] = 'S';
                }
            });
            console.log(`[PermissionManager] 已从 ops.json 自动同步 S 级玩家。`);
        } catch (error: any) {
            if (error.code !== 'ENOENT') console.error(`[PermissionManager] 加载 ops.json 出错:`, error);
        }

        console.log(`[PermissionManager] 权限表初始化完毕，共记录 ${Object.keys(this.permissions).length} 名玩家。`);
    }

    /**
     * Get permission level for a player.
     * Default to 'C' if not found.
     */
    public getPlayerLevel(playerName: string): PermissionLevel {
        return this.permissions[playerName] || 'C';
    }

    /**
     * Update player permission level and save to file.
     */
    public async setPlayerLevel(playerName: string, level: PermissionLevel): Promise<void> {
        this.permissions[playerName] = level;
        try {
            await fs.writeFile(this.permissionPath, JSON.stringify(this.permissions, null, 2));
            console.log(`[PermissionManager] 已更新 ${playerName} 至 ${level} 级。`);
        } catch (error) {
            console.error(`[PermissionManager] 保存权限表失败:`, error);
        }
    }
}

// Export singleton
export const permissionManager = new PermissionManager();
