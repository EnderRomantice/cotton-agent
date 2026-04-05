import { Tail } from 'tail';
import { AgentLoop } from './agentLoop.js';

export class LogTailer {
    private tail?: Tail;
    
    constructor(private logPath: string, private agentLoop: AgentLoop) {}

    start() {
        if (!this.logPath) {
            console.error('[LogTailer] 日志路径为空，请在 .env 中设置 MC_LOG_PATH');
            return;
        }

        try {
            this.tail = new Tail(this.logPath, {
                fromBeginning: false,
                follow: true,
                useWatchFile: true,
            });

            console.log(`[LogTailer] 开始监听日志文件: ${this.logPath}`);

            this.tail.on('line', (data: string) => {
                this.parseLine(data);
            });

            this.tail.on('error', (error: any) => {
                console.error('[LogTailer] 追踪模块发生错误: ', error);
            });
        } catch (e) {
            console.error('[LogTailer] 无法启动文件读取，检查路径是否正确: ', e);
        }
    }

    private parseLine(line: string) {
        // 非常基础的正则清洗和噪点过滤
        
        // 过滤掉一些绝对无用的高频垃圾日志
        if (
            line.includes('RCON') || 
            line.includes('Saving chunks') || 
            line.includes('pinged the server')
        ) {
            return;
        }

        // 把日志推送到状态中心 Buffer
        this.agentLoop.addLogLine(line);
    }
}
