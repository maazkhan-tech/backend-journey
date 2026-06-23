// server.js
const http = require('http');

// Helper: read the request body (it comes in as a stream, not all at once)
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      console.log(body)
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

// In-memory store (no database yet)
let tasks = [
  { id: 1, title: 'Learn Node.js', done: false },
];
let nextId = 2;

// Helper: send a JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/tasks') {
    return sendJSON(res, 200, { data: tasks });
  }

  if (method === 'POST' && url === '/tasks') {
    try {
      const body = await readBody(req);
      if (!body.title) {
        return sendJSON(res, 400, { error: { message: 'title is required' } });
      }
      const task = { id: nextId++, title: body.title, done: false };
      tasks.push(task);
      return sendJSON(res, 201, { data: task });
    } catch {
      return sendJSON(res, 400, { error: { message: 'Invalid JSON body' } });
    }
  }

  const taskMatch = url.match(/^\/tasks\/(\d+)$/);
  const taskIndex = taskMatch
    ? tasks.findIndex(t => t.id === parseInt(taskMatch[1]))
    : -1;

  if (method === 'GET' && taskMatch) {
    if (taskIndex === -1) {
      return sendJSON(res, 404, { error: { message: 'Task not found' } });
    }
    return sendJSON(res, 200, { data: tasks[taskIndex] });
  }

  if (method === 'PATCH' && taskMatch) {
    if (taskIndex === -1) {
      return sendJSON(res, 404, { error: { message: 'Task not found' } });
    }
    try {
      const body = await readBody(req);
      if (body.done === undefined) {
        return sendJSON(res, 400, { error: { message: 'done status is required' } });
      }
      tasks[taskIndex].done = !!body.done;
      return sendJSON(res, 200, { data: tasks[taskIndex] });
    } catch {
      return sendJSON(res, 400, { error: { message: 'Invalid JSON body' } });
    }
  }

  if (method === 'DELETE' && taskMatch) {
    if (taskIndex === -1) {
      return sendJSON(res, 404, { error: { message: 'Task not found' } });
    }
    tasks.splice(taskIndex, 1);
    res.writeHead(204);
    return res.end();
  }

  sendJSON(res, 404, { error: { message: 'Route not found' } });
});

  



server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});