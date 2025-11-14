import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import PersonaCard from '../components/PersonaCard.jsx';
import { supabase } from './supabase.js';

function Persona() {
  const personas = [
    { name: 'Innovator', icon: '🚀', description: 'Tech-savvy, loves crypto & startups.' },
    { name: 'Traditionalist', icon: '📈', description: 'Plays it safe with stocks & bonds.' },
    { name: 'Adventurer', icon: '🌍', description: 'Risk-taker, dives into volatile markets.' },
    { name: 'Athlete', icon: '🏅', description: 'Invests with discipline, like training.' },
    { name: 'Artist', icon: '🎨', description: 'Creative, seeks passion-driven investments.' },
  ];

  const [selectedPersona, setSelectedPersona] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when persona is selected
  useEffect(() => {
    if (selectedPersona && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 500);
    }
  }, [selectedPersona]);

  const handleSelect = async (persona) => {
    console.log('Clicked persona:', persona.name);
    setSelectedPersona(persona);
    setMessages([
      { role: 'bot', content: `Hello! I'm your ${persona.name} financial assistant. How can I help you today?` }
    ]);
    
    // Try to save the persona to Supabase, but don't block the UI if it fails
    try {
      const payload = { name: persona.name, selected_at: new Date() };
      console.log('Inserting to Supabase:', JSON.stringify(payload));
      
      const { data, error } = await supabase
        .from('personas')
        .insert([payload])
        .select();
        
      if (error) {
        console.warn('Supabase insert warning:', JSON.stringify(error, null, 2));
        console.warn('Proceeding without saving persona to Supabase');
      } else {
        console.log('Persona saved to Supabase:', persona.name);
      }
    } catch (error) {
      console.warn('Error saving persona, proceeding anyway:', error.message);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setMessages(prevMessages => [...prevMessages, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);
    console.log('Sending chat message:', userMessage, 'Persona:', selectedPersona.name);
    
    // Focus the input again
    inputRef.current?.focus();
    
    try {
      // Use local backend URL for development
      const apiUrl = 'http://localhost:3001/api/chat';
      console.log(`Sending request to: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, persona: selectedPersona.name }),
      });
      
      console.log('Fetch response status:', response.status, 'OK:', response.ok);
      const data = await response.json();
      console.log('Chat response received:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        const errorMsg = data.error?.message || (typeof data.error === 'string' ? data.error : 'Unknown error');
        console.error(`API error: ${errorMsg}`);
        
        // If we get a 401 error, it's likely an API key issue - use fallback response
        if (response.status === 401) {
          console.warn('Using fallback response due to API key issue');
          const fallbackResponse = getFallbackResponse(userMessage, selectedPersona.name);
          setMessages(prevMessages => [...prevMessages, { 
            role: 'bot', 
            content: fallbackResponse
          }]);
          return;
        }
        
        throw new Error(errorMsg);
      }
      
      // Add bot response to chat with sources if available
      const botMessage = { 
        role: 'bot', 
        content: data.reply,
        contextUsed: data.contextUsed || 0,
        sources: data.sources || []
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
      
    } catch (error) {
      console.error('Error fetching chat response:', error.message);
      
      // Use fallback response in case of errors
      const fallbackResponse = getFallbackResponse(userMessage, selectedPersona.name);
      
      // Add error message to chat
      setMessages(prevMessages => [...prevMessages, { 
        role: 'bot', 
        content: fallbackResponse,
        isError: false // Not marking as error since we're showing a valid response
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fallback responses when API is not available
  const getFallbackResponse = (message, persona) => {
    const responses = {
      'Innovator': [
        "I recommend looking into emerging blockchain technologies with real-world applications. Many companies are building infrastructure for the Web3 ecosystem.",
        "Consider allocating a portion of your portfolio to AI-focused ETFs - this sector has strong growth potential.",
        "Startups in the green energy space are particularly promising right now with increased global focus on sustainability."
      ],
      'Traditionalist': [
        "A balanced portfolio with 60% index funds, 30% bonds, and 10% cash reserves would be a prudent approach.",
        "Blue-chip dividend stocks provide reliable income and stability during market fluctuations.",
        "I'd suggest considering Treasury bonds as part of your fixed-income allocation for safety."
      ],
      'Adventurer': [
        "Emerging markets in Southeast Asia show promising growth trajectories for investors willing to accept higher volatility.",
        "Consider a barbell strategy: combine safe investments with high-potential opportunities in new sectors.",
        "The carbon credit market represents an interesting opportunity as climate regulations tighten globally."
      ],
      'Athlete': [
        "Let's structure your investments like a training program: regular contributions, quarterly portfolio reviews, and annual goal-setting.",
        "Track your savings rate like you would track athletic progress - aim to increase it by 1% every quarter.",
        "Consider setting up 'sprint' savings periods to maximize your investment capacity."
      ],
      'Artist': [
        "ESG investments that align with your values can generate both returns and positive impact in areas you care about.",
        "Consider fractional art investing through platforms that connect with your creative passions.",
        "Community investment opportunities that support local creative initiatives can be both meaningful and profitable."
      ]
    };
    
    // Default to Traditionalist if persona not found
    const options = responses[persona] || responses['Traditionalist'];
    return options[Math.floor(Math.random() * options.length)];
  };

  // Generate bubbles
  useEffect(() => {
    const bubbleContainer = document.querySelector('.bubble-container');
    const numBubbles = 20;
    for (let i = 0; i < numBubbles; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.width = `${Math.random() * 30 + 10}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.left = `${Math.random() * 100}vw`;
      bubble.style.animationDuration = `${Math.random() * 8 + 4}s`;
      bubble.style.animationDelay = `${Math.random() * 5}s`;
      bubbleContainer.appendChild(bubble);
    }

    return () => {
      bubbleContainer.innerHTML = '';
    };
  }, []);

  // Format message content with line breaks
  const formatMessage = (content) => {
    return content.split('\n').map((line, i) => 
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-b from-pink-100 to-pink-200 text-gray-800 min-h-screen px-4 pb-6 relative overflow-hidden">
      <div className="bubble-container absolute inset-0 z-0"></div>
      <Header />
      <div className="max-w-4xl mx-auto pt-20 md:pt-28 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl gradient-text font-extrabold mb-3">
            Choose Your Financial Persona
          </h2>
          <p className="text-gray-600 text-lg">
            Select an advisor that matches your investment style
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.name}
              persona={persona}
              onSelect={handleSelect}
              isSelected={selectedPersona?.name === persona.name}
            />
          ))}
        </div>
        {selectedPersona && (
          <div id="chat-section" className="mt-12 max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f472b6] to-[#db2777] text-white text-2xl flex items-center justify-center mr-3 shadow-glow">
                {selectedPersona.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold gradient-text mb-1">{selectedPersona.name} Advisor</h3>
                <p className="text-gray-700 text-sm">{selectedPersona.description}</p>
              </div>
            </div>
            
            {/* Chat messages container */}
            <div 
              ref={messagesContainerRef}
              className="flex flex-col gap-4 mb-4 h-[450px] overflow-y-auto p-4 bg-white rounded-xl border border-pink-200 shadow-xl"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#f472b6 #ffffff' }}
            >
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {message.role === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#f472b6] to-[#db2777] text-white text-sm flex items-center justify-center mr-2 mt-1 shadow-md">
                        {selectedPersona.icon}
                      </div>
                    )}
                    <div 
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-tr-none shadow-blue' 
                          : message.isError
                            ? 'bg-[#fee2e2] text-[#ef4444] border border-[#f87171] rounded-tl-none shadow-md'
                            : 'bg-[#f5f5f5] text-gray-800 rounded-tl-none shadow-md'
                      }`}
                    >
                      <div className="text-base leading-relaxed">
                        {formatMessage(message.content)}
                      </div>
                      {message.role === 'bot' && message.contextUsed > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                            </svg>
                            Sources from SEC filings:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, idx) => (
                              <span key={idx} className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                {source.ticker} {source.year} - {source.section.replace('item_', 'Item ').replace('_', '.')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white text-sm flex items-center justify-center ml-2 mt-1 shadow-md">
                        👤
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <p>Your conversation will appear here</p>
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#f472b6] to-[#db2777] text-white text-sm flex items-center justify-center mr-2 mt-1 shadow-md">
                    {selectedPersona.icon}
                  </div>
                  <div className="max-w-[80%] p-4 rounded-2xl bg-[#f5f5f5] text-gray-800 rounded-tl-none shadow-md">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleChatSubmit} className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask the ${selectedPersona.name} advisor about finance...`}
                className="w-full p-4 pr-[120px] rounded-full bg-white text-gray-800 border border-pink-200 focus:outline-none focus:border-[#3b82f6] placeholder-gray-500 font-normal shadow-xl transition-all"
                style={{ caretColor: 'black' }}
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim()}
                className="absolute right-2 py-2 px-6 bg-[#ff1493] hover:bg-[#ff007c] text-pink rounded-full disabled:opacity-50 font-extrabold text-lg shadow-xl transition-all duration-200 flex items-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending
                  </span>
                ) : (
                  <span className="flex items-center">
                    Send
                    <svg className="ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
      <style jsx="true">{`
        .shadow-glow {
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.5);
        }
        .shadow-blue {
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.2);
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        div::-webkit-scrollbar-track {
          background:rgb(96, 0, 57);
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: #f472b6;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #db2777;
        }
      `}</style>
    </div>
  );
}

export default Persona;