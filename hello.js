// hello.js
const http = require("http");

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello from Node.js" }));
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
