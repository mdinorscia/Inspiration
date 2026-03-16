import { useState, useRef, useEffect } from 'react';
import { CATEGORIES, TRACKS, TEAM } from '../utils/constants';
import { getToday, getWeekEntries } from '../utils/store';

function buildSystemPrompt() {
  const today = getToday();
  const weekEntries = getWeekEntries();

  let context = `You are the AI assistant inside the Grain & Grit Executive OS — a personal executive dashboard built for Mike DiNorscia, CEO of Grain & Grit Collective (~$16M revenue, Broken Yolk Café franchises + Carnitas Snack Shack San Diego).

You are structured, direct, and know Mike's context cold. No fluff. Speak like a sharp operator-to-operator.

MIKE'S FOUR STRATEGIC TRACKS:
1. Personal OS — faith, family, health, leadership, networking
2. Real Estate Acquisition — multifamily AZ/UT + Heber STR
3. AI / Automation Mastery — n8n operator-builder
4. Riptide Baseball — 9U coaching + 14U select team build

MIKE'S TEAM (for delegation suggestions):
${TEAM.map((t) => `- ${t.name}: ${t.role}`).join('\n')}

DELEGATION RULES: If Mike asks about something that should be delegated, flag it. Operations → McKenna, Marketing → Kassie, Legal → Jon, Admin → Yenz, Baseball Admin → Danielle, Baseball Execution → Assistant Coach.`;

  if (today?.scores) {
    context += `\n\nTODAY'S SCORES:\n`;
    for (const cat of CATEGORIES) {
      const score = today.scores[cat.id];
      if (score != null) {
        const status = score < 6 ? 'RED' : score <= 7 ? 'AMBER' : 'GREEN';
        context += `- ${cat.label}: ${score}/10 (${status})`;
        if (today.notes?.[cat.id]) context += ` — "${today.notes[cat.id]}"`;
        context += '\n';
      }
    }
  }

  if (today?.trackActions) {
    context += `\nTODAY'S TRACK ACTIONS:\n`;
    for (const track of TRACKS) {
      if (today.trackActions[track.id]) {
        context += `- ${track.label}: ${today.trackActions[track.id]}\n`;
      }
    }
  }

  if (today?.priorities) {
    context += `\nTODAY'S PRIORITIES:\n`;
    for (const p of today.priorities) {
      context += `- [${p.done ? 'DONE' : 'OPEN'}] ${p.level}: ${p.text}\n`;
    }
  }

  if (weekEntries.length > 1) {
    context += `\nWEEK SUMMARY: ${weekEntries.length} check-ins this week.`;
  }

  context += `\n\nBEHAVIOR:
- Keep responses concise and action-oriented
- When Mike asks to add something, confirm what it is and where it fits in his system
- When Mike has questions, answer with his specific context in mind
- Suggest delegation when appropriate
- Never generate more than 5 priority items
- Reference his scores and tracks when relevant`;

  return context;
}

export default function Chat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "What do you need, Mike? I've got your scores, priorities, and tracks loaded. Ask me anything — add a task, reprioritize, delegate, or think through a decision.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gg_api_key') || '');
  const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem('gg_proxy_url') || '');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function saveSettings() {
    localStorage.setItem('gg_api_key', apiKey);
    localStorage.setItem('gg_proxy_url', proxyUrl);
    setShowSettings(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Build API messages (skip the initial greeting)
      const apiMessages = updatedMessages
        .filter((_, i) => i > 0 || updatedMessages[0].role === 'user')
        .map((m) => ({ role: m.role, content: m.content }));

      // If first message is assistant greeting, only send from first user message onward
      const chatHistory = [];
      let foundUser = false;
      for (const m of updatedMessages) {
        if (m.role === 'user') foundUser = true;
        if (foundUser) chatHistory.push({ role: m.role, content: m.content });
      }

      const endpoint = proxyUrl || 'https://api.anthropic.com/v1/messages';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          ...(proxyUrl ? { 'x-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: buildSystemPrompt(),
          messages: chatHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const assistantText = data.content?.[0]?.text || 'No response received.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}. Tap the gear icon to check your API settings.` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!isOpen) return null;

  const panelStyle = {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: '100%',
    maxWidth: 420,
    height: '70vh',
    maxHeight: 600,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px 16px 0 0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.3s ease-out',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  };

  const msgAreaStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  };

  const inputAreaStyle = {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  };

  const btnIcon = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 18,
    padding: 4,
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700 }}>Chat</p>
          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Context-aware assistant</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnIcon} onClick={() => setShowSettings(!showSettings)} title="Settings">
            {showSettings ? '\u2716' : '\u2699'}
          </button>
          <button style={btnIcon} onClick={onClose} title="Close">
            \u2715
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', flexShrink: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>API Settings</p>
          <input
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 13,
              marginBottom: 8,
              outline: 'none',
            }}
            type="password"
            placeholder="Anthropic API key (sk-ant-...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <input
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 13,
              marginBottom: 8,
              outline: 'none',
            }}
            placeholder="Proxy URL (your Cloudflare Worker URL)"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
          />
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
            The proxy URL is required for browser requests. Deploy the included Cloudflare Worker — see worker/README.md
          </p>
          <button
            onClick={saveSettings}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={msgAreaStyle}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={i}
              style={{
                marginBottom: 12,
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isUser ? 'var(--accent)' : 'var(--bg-card)',
                  color: isUser ? '#fff' : 'var(--text)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '14px 14px 14px 4px',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={inputAreaStyle}>
        <input
          ref={inputRef}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
          }}
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 16px',
            background: input.trim() ? 'var(--accent)' : 'var(--bg-input)',
            color: input.trim() ? '#fff' : 'var(--text-dim)',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
