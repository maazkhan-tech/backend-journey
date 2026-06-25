import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';

import { Task, CreateTaskInput, UpdateTaskInput, ApiResponse } from './types';

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function sendJSON<T>(
  res: ServerResponse,
  statusCode: number,
  data: ApiResponse<T>,
): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });

  res.end(JSON.stringify(data));
}

const tasks: Task[] = [
  {
    id: 1,
    title: 'Learn Node.js',
    done: false,
  },
];

let nextId = 2;

const server = http.createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const method = req.method;
    const url = req.url;

    if (!method || !url) {
      return sendJSON(res, 400, {
        error: {
          message: 'Invalid request',
        },
      });
    }

    // GET /tasks
    if (method === 'GET' && url === '/tasks') {
      return sendJSON<Task[]>(res, 200, {
        data: tasks,
      });
    }

    // POST /tasks
    if (method === 'POST' && url === '/tasks') {
      try {
        const body = (await readBody(req)) as CreateTaskInput;

        if (!body.title) {
          return sendJSON(res, 400, {
            error: {
              message: 'title is required',
            },
          });
        }

        const task: Task = {
          id: nextId++,
          title: body.title,
          done: false,
        };

        tasks.push(task);

        return sendJSON<Task>(res, 201, {
          data: task,
        });
      } catch {
        return sendJSON(res, 400, {
          error: {
            message: 'Invalid JSON body',
          },
        });
      }
    }

    const taskMatch = url.match(/^\/tasks\/(\d+)$/);

    const taskIndex = taskMatch
      ? tasks.findIndex((task) => task.id === Number(taskMatch[1]))
      : -1;

    // GET /tasks/:id
    if (method === 'GET' && taskMatch) {
      if (taskIndex === -1) {
        return sendJSON(res, 404, {
          error: {
            message: 'Task not found',
          },
        });
      }

      return sendJSON<Task>(res, 200, {
        data: tasks[taskIndex],
      });
    }

    // PATCH /tasks/:id
    if (method === 'PATCH' && taskMatch) {
      if (taskIndex === -1) {
        return sendJSON(res, 404, {
          error: {
            message: 'Task not found',
          },
        });
      }

      try {
        const body = (await readBody(req)) as UpdateTaskInput;

        if (body.done === undefined && body.title === undefined) {
          return sendJSON(res, 400, {
            error: {
              message: 'Provide done or title',
            },
          });
        }

        if (body.done !== undefined) {
          tasks[taskIndex].done = body.done;
        }

        if (body.title !== undefined) {
          tasks[taskIndex].title = body.title;
        }

        return sendJSON<Task>(res, 200, {
          data: tasks[taskIndex],
        });
      } catch {
        return sendJSON(res, 400, {
          error: {
            message: 'Invalid JSON body',
          },
        });
      }
    }

    // DELETE /tasks/:id
    if (method === 'DELETE' && taskMatch) {
      if (taskIndex === -1) {
        return sendJSON(res, 404, {
          error: {
            message: 'Task not found',
          },
        });
      }

      tasks.splice(taskIndex, 1);

      res.writeHead(204);
      return res.end();
    }

    return sendJSON(res, 404, {
      error: {
        message: 'Route not found',
      },
    });
  },
);

server.listen(3000, () => {
  process.stdout.write('Server running on http://localhost:3000\n');
});
