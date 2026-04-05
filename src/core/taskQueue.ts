import { RconService } from './rconClient.js';

export type TaskStatus = 'WAITING' | 'PENDING_APPROVAL' | 'EXECUTING' | 'DONE' | 'FAILED' | 'CANCELLED';
export type TaskType = 'RCON' | 'FS' | 'MC_FUNCTION';

export interface TaskItem {
    id: string;
    type: TaskType;
    command: string;
    description: string;
    status: TaskStatus;
    createdAt: number;
    approvedAt?: number;
    executedAt?: number;
    result?: string;
}

export class TaskQueue {
    private queue: TaskItem[] = [];
    private nextId: number = 1;

    constructor(private rcon: RconService) {}

    /**
     * Add a task that requires approval.
     */
    addPendingTask(type: TaskType, command: string, description: string): string {
        const id = (this.nextId++).toString();
        const task: TaskItem = {
            id,
            type,
            command,
            description,
            status: 'PENDING_APPROVAL',
            createdAt: Date.now(),
        };
        this.queue.push(task);
        console.log(`[TaskQueue] Added pending task #${id}: ${description}`);
        return id;
    }

    /**
     * Add a task for immediate execution.
     */
    async executeImmediate(type: TaskType, command: string, description: string): Promise<string> {
        const id = (this.nextId++).toString();
        console.log(`[TaskQueue] Executing immediate task #${id}: ${description}`);
        
        try {
            let result = '';
            if (type === 'RCON') {
                result = await this.rcon.executeCommand(command);
            }
            // Add FS/MC_FUNCTION logic here if needed, or stick to RCON for now
            
            return result || 'Success';
        } catch (e: any) {
            console.error(`[TaskQueue] Task #${id} failed:`, e);
            throw e;
        }
    }

    /**
     * Approve a pending task.
     */
    async approveTask(id: string): Promise<boolean> {
        const task = this.queue.find(t => t.id === id && t.status === 'PENDING_APPROVAL');
        if (!task) return false;

        task.status = 'EXECUTING';
        task.approvedAt = Date.now();
        console.log(`[TaskQueue] Task #${id} approved. Executing...`);

        try {
            let result = '';
            if (task.type === 'RCON') {
                result = await this.rcon.executeCommand(task.command);
            }
            task.status = 'DONE';
            task.executedAt = Date.now();
            task.result = result;
            return true;
        } catch (e: any) {
            task.status = 'FAILED';
            task.result = e.message;
            return false;
        }
    }

    /**
     * Get a task by ID.
     */
    getTask(id: string): TaskItem | undefined {
        return this.queue.find(t => t.id === id);
    }

    /**
     * List all pending tasks.
     */
    getPendingTasks(): TaskItem[] {
        return this.queue.filter(t => t.status === 'PENDING_APPROVAL');
    }
}
