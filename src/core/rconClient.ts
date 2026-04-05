import { Rcon } from 'rcon-client';
import { config } from '../config.js';

export class RconService {
  private rcon?: Rcon;
  public availableCommands: string = '';

  constructor() {}

  async connect() {
    this.rcon = await Rcon.connect({
        host: config.rcon.host,
        port: config.rcon.port,
        password: config.rcon.password,
    });
    
    console.log('[RconService] 成功连接至 Minecraft 服务器');

    // Agent 初始化时主动获取服务端所有可用的指令
    try {
      this.availableCommands = await this.executeCommand('help');
      console.log('[RconService] 成功拉取服务器指令清单 (help)。');
    } catch (e) {
      console.warn('[RconService] 拉取指令清单失败。', e);
    }
  }

  /**
   * 执行服务端控制台命令，并返回执行结果
   * @param command 用户提供的命令（可带/也可不带）
   */
  async executeCommand(command: string): Promise<string> {
    if (!this.rcon) {
        throw new Error('RCON 未连接');
    }
    
    // 控制台是不需要 / 的，但是如果大模型误生成了带有 / 的指令，我们需要自动进行裁剪
    const sanitizedCommand = command.trim().startsWith('/') 
        ? command.trim().slice(1) 
        : command.trim();
        
    const response = await this.rcon.send(sanitizedCommand);
    return response;
  }

  async disconnect() {
    if (this.rcon) {
        this.rcon.end();
        this.rcon = undefined;
    }
  }
}
