import React, { useState, useRef, useEffect } from 'react';
import weedLogo from '../assets/weedLogo.jpg';
import { useNavigate } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import axios from 'axios';

const Chatpage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const chatEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
        window.location.reload()
    };

    const saveMessageToDB = async (role, content) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/chat/save-message`,
                {
                    sender: role,
                    message: content,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (err) {
            console.error("Failed to save message:", err);
        }
    };


    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setInput('');
        setLoading(true);

        // Save user message
        await saveMessageToDB('user', input);

        try {
            const formattedPrompt = [
                "You are a friendly, empathetic AI weed therapy assistant...",
                ...newMessages.map(msg => `${msg.role === 'user' ? 'User' : 'Therapist'}: ${msg.content}`),
                "Therapist:"
            ].join('\n');

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

            const response = await axios.post(
                url,
                {
                    contents: [{ parts: [{ text: formattedPrompt }] }],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data;

            let botReply = "Sorry, I couldn't come up with a response. Try again?";
            if (data.candidates && data.candidates.length > 0) {
                botReply = data.candidates[0].content.parts[0].text;
            }

            const botMessage = { role: 'assistant', content: botReply };
            setMessages([...newMessages, botMessage]);

            // Save bot message
            await saveMessageToDB('bot', botReply);

        } catch (error) {
            console.error("Gemini error:", error);
            const errorReply = {
                role: 'assistant',
                content: "🌐 Something went wrong connecting to your therapist. Please try again.",
            };
            setMessages([...newMessages, errorReply]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    useEffect(() => {
        const fetchChatHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth');
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/chat/all`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const dbMessages = res.data.chats.map(chat => ({
                    role: chat.sender === 'user' ? 'user' : 'assistant',
                    content: chat.message,
                }));

                // If no previous messages, show welcome message
                setMessages(dbMessages.length ? dbMessages : [
                    { role: 'assistant', content: "Hi, I'm your friendly weed therapy chatbot 🌱. How are you feeling today?" }
                ]);

            } catch (err) {
                console.error("Error fetching chat history:", err);
            }
        };

        fetchChatHistory();
    }, []);




    return (
        <div className="min-h-screen bg-[#fdfaf4] flex flex-col items-center px-4 py-8 font-sans relative">
            {/* Header */}
            <div className="w-full max-w-2xl relative mb-4 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <img src={weedLogo} alt="Weed Therapy Logo" className="h-10 w-10 rounded-full object-cover" />
                    <h1 className="text-2xl font-bold text-[#4b3f2f]">WEED THERAPY</h1>
                </div>

                <div className="absolute right-0">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="text-[#4b3f2f] text-xl rounded-full hover:opacity-80"
                    >
                        <CgProfile />
                    </button>
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 bg-white border rounded-xl shadow-md z-10">
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>


            <p className="text-center text-[#7a6c58] mb-4 text-sm">
                Your personal daily assistant for mindful cannabis use
            </p>

            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-[#e2dcd2] flex flex-col flex-grow">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f3ee] rounded-t-2xl max-h-[60vh] min-h-[300px]">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`
                  max-w-[75%] px-4 py-2 rounded-xl text-sm whitespace-pre-wrap
                  ${msg.role === 'user' ? 'bg-[#cbe6c1] text-[#2e4632]' : 'bg-[#e6d5b8] text-[#4b3f2f]'}
                `}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="text-left text-sm text-gray-500 italic animate-pulse">
                            Therapist is typing<span className="animate-bounce">...</span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-[#e2dcd2] bg-[#fdfaf4]">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        aria-label="Type your message"
                        className="w-full px-4 py-2 border border-[#d9cfc0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a3d3a1]"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className={`w-full mt-3 text-white py-2 rounded-xl transition duration-200 
              ${loading ? 'bg-[#aacfb5] cursor-not-allowed' : 'bg-[#6cb28e] hover:bg-[#5fa47f]'}`}
                    >
                        {loading ? 'Thinking...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatpage;
