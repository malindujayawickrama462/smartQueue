import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Allowing all origins for simple local development
            methods: ["GET", "POST", "PATCH"]
        }
    });

    io.on("connection", (socket) => {
        // Student or Staff joins their exclusive channel based on their User ID
        socket.on("join-room", (userId) => {
            if (userId) {
                socket.join(userId);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized yet!");
    }
    return io;
};
