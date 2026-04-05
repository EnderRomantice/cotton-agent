import { z } from 'zod';
import { tool } from 'ai';

const myTool = tool({
  description: 'test',
  parameters: z.object({ command: z.string() })
});

console.log(JSON.stringify(myTool.parameters, null, 2));
