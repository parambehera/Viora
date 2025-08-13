import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from "../providers/Sockets";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Home = () => {
    const [myUsername, setMyUserName] = useState(() => localStorage.getItem("username") || "");
    const [partnerUsername, setPartnerUsername] = useState("");
    const navigate = useNavigate();
    const socket = useSocket();

    const generateRoomId = (userA, userB) => {
        return [userA.trim().toLowerCase(), userB.trim().toLowerCase()].sort().join("_");
    };

    const handleJoinRoom = () => {
        if (!myUsername || !partnerUsername) {
            toast.error("Please enter both usernames");
            return;
        }
        const generatedRoomId = generateRoomId(myUsername, partnerUsername);
        socket.emit("join-room", { emailId: myUsername, roomId: generatedRoomId });
    };

    const handleRoomJoined = useCallback(({ roomId }) => {
        navigate(`/room/${roomId}`);
    }, [navigate]);

 // EVEN BETTER (More Robust)
const handleRoomFull = (msg) => {
    const errorMessage = typeof msg === 'object' && msg.message ? msg.message : msg;
    toast.error(errorMessage);
};

    useEffect(() => {
        socket.on("joined-room", handleRoomJoined);
        socket.on("room-full", handleRoomFull);
        return () => {
            socket.off("joined-room", handleRoomJoined);
            socket.off("room-full", handleRoomFull);
        };
    }, [socket, handleRoomJoined]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-[#0f172a] to-[#1e293b] text-white flex flex-col">
            {/* Top Navbar */}
            <div className="flex justify-between items-center px-6 py-4 w-full">
                <h1
                    className="text-2xl font-bold cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    Viora
                </h1>
            </div>
            {/* Main Content */}
            <div className="flex flex-1 items-center justify-center">
                <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-10 w-full max-w-lg transition-all duration-300">
                    <h1 className="text-4xl font-bold text-orange-500 text-center mb-4">Viora</h1>
                    <p className="text-xl font-semibold text-center text-white mb-8">Connect with your Loved Ones</p>
                    <div className="space-y-5">
                        <input
                            type="text"
                            placeholder="Your Username"
                            value={myUsername}
                            readOnly
                            className="w-full px-4 py-3 bg-transparent border border-gray-500 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <input
                            type="text"
                            placeholder="Partner's Username"
                            value={partnerUsername}
                            onChange={(e) => setPartnerUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-transparent border border-gray-500 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                            onClick={handleJoinRoom}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                            Start Call
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
