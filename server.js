const http = require("http");
const {
    WebSocketServer,
    WebSocket
} = require("ws");

const PORT = process.env.PORT || 10000;

// Servidor HTTP básico
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("WebSocket Server online");
});

// Servidor WebSocket
const wss = new WebSocketServer({
    server,
    path: "/ws"
});

wss.on("connection", (socket, request) => {

    const url = new URL(
        request.url,
        `http://${request.headers.host}`
    );

    const role = url.searchParams.get("role");

    // Aceita somente Site A ou Site B
    if (role !== "a" && role !== "b") {
        socket.close(1008, "Role inválida");
        return;
    }

    socket.role = role;

    console.log(`Cliente conectado: ${role}`);

    socket.on("message", (message) => {

        // O Site B somente recebe.
        if (socket.role !== "a") {
            return;
        }

        let data;

        try {
            data = JSON.parse(message.toString());
        } catch {
            return;
        }

        // Envia a mensagem para todos os Sites B conectados
        wss.clients.forEach((client) => {

            if (
                client.readyState === WebSocket.OPEN &&
                client.role === "b"
            ) {
                client.send(JSON.stringify(data));
            }

        });

    });

    socket.on("close", () => {
        console.log(`Cliente desconectado: ${role}`);
    });

});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
