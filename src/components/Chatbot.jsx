import React, { useState } from 'react';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            setMessages([...messages, { text: input, sender: 'user' }]);
            setInput('');
            // Simulate bot response
            setTimeout(() => {
                setMessages(prevMessages => [
                    ...prevMessages,
                    { text: 'This is a bot response', sender: 'bot' }
                ]);
            }, 1000);
        }
    };

    return (
        <div className="chatbot flex flex-col h-full w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="chat-window flex-1 p-4 overflow-y-auto space-y-2">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] p-2 rounded ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
                            {message.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="input-area flex flex-col sm:flex-row gap-2 p-4 border-t border-gray-200">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 p-2 border border-gray-300 rounded"
                    placeholder="Type a message..."
                />
                <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded w-full sm:w-auto">Send</button>
            </div>
        </div>
    );
};

export default Chatbot;