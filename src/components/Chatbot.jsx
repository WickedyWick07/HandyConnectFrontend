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
        <div className="chatbot flex flex-col h-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="chat-window flex-1 p-4 overflow-y-auto">
                {messages.map((message, index) => (
                    <div key={index} className={`message mb-2 p-2 rounded ${message.sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start'}`}>
                        {message.text}
                    </div>
                ))}
            </div>
            <div className="input-area flex p-4 border-t border-gray-200">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 p-2 border border-gray-300 rounded mr-2"
                    placeholder="Type a message..."
                />
                <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded">Send</button>
            </div>
        </div>
    );
};

export default Chatbot;