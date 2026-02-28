import { useEffect, useRef, useState, useCallback } from 'react';

export function useChatWebSocket({ threadId, onMessage, onConnect, onDisconnect }) {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!threadId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.VITE_WS_HOST || window.location.host;
      let wsUrl = `${protocol}//${host}/ws/chat/thread/${threadId}/`;

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const guestSessionKey = localStorage.getItem('guestSessionKey');

      if (!currentUser && guestSessionKey) {
        wsUrl += `?session_key=${guestSessionKey}`;
      }

      console.log('🔌 Connecting to WebSocket:', wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received:', data);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        onDisconnect?.();

        if (event.code === 4005) {
          // Access denied - don't retry
          setError('Access denied. Please refresh the page.');
          console.error('Access denied. Check your session key.');
        } else if (reconnectAttempts.current < maxReconnectAttempts) {
          // Connection lost - retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`Reconnecting in ${delay}ms...`);
          reconnectAttempts.current++;

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('Unable to connect. Please refresh the page.');
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to establish connection');
    }
  }, [threadId, onMessage, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current && isConnected) {
      const payload = {
        type: 'chat_message',
        message: message,
      };
      ws.current.send(JSON.stringify(payload));
      return true;
    } else {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }
  }, [isConnected]);

  const sendOffer = useCallback((offer) => {
    if (ws.current && isConnected) {
      const payload = {
        type: 'offer',
        offer: {
          title: offer.title,
          price: offer.price,
          timeline: offer.timeline,
          description: offer.description,
        },
      };
      ws.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, [isConnected]);

  const sendTyping = useCallback(() => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify({ type: 'typing' }));
    }
  }, [isConnected]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    sendOffer,
    sendTyping,
    reconnect: connect,
    disconnect,
  };
}