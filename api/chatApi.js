/**
 * Chat API Service
 * Handles all chat/messaging related API calls
 * Supports both authenticated users and guest sessions
 * @module chatApi
 */

import httpClient from "./httpClient";

const chatApi = {
  /**
   * Initialize guest session and get guest label
   * @returns {Promise<{csrfToken: string, sessionId: string, guestLabel: string}>}
   */
  initGuestSession: async () => {
    const response = await httpClient.get("/users/csrf-and-session/");
    return response.data;
  },

  /**
   * Get all threads for authenticated user
   * @returns {Promise<{count: number, threads: Array}>}
   */
  getThreads: async () => {
    const response = await httpClient.get("/chat/threads/");
    return response.data;
  },

  /**
   * Get all threads for a guest session
   * @param {string} sessionKey - Guest session key
   * @returns {Promise<{results: Array}>}
   */
  getGuestThreads: async (sessionKey) => {
    const response = await httpClient.get("/chat/guest-threads/", {
      params: { session_key: sessionKey },
    });
    return response.data;
  },

  /**
   * Preview guest threads before linking to account
   * @param {string} guestSessionKey - Guest session key
   * @returns {Promise<{session_key: string, thread_count: number, threads: Array}>}
   */
  previewGuestThreads: async (guestSessionKey) => {
    const response = await httpClient.get("/chat/threads/preview-guest-threads/", {
      params: { guest_session_key: guestSessionKey },
    });
    return response.data;
  },

  /**
   * Create or get a chat thread
   * @param {string} freelancerUsername - Username of the freelancer
   * @param {string|null} sessionKey - Optional guest session key
   * @returns {Promise<Object>} Thread data
   */
  createThread: async (freelancerUsername, sessionKey = null) => {
    const endpoint = sessionKey ? "/chat/guest-thread/create/" : "/chat/threads/";
    const payload = sessionKey
      ? { freelancer_username: freelancerUsername, session_key: sessionKey }
      : { other_user_username: freelancerUsername };

    const response = await httpClient.post(endpoint, payload);
    return response.data;
  },

  getThread: async (threadId, sessionKey = null) => {
    const params = sessionKey ? { session_key: sessionKey } : {};
    const response = await httpClient.get(`/chat/threads/${threadId}/`, { params });
    return response.data;
  },

  /**
   * Link guest threads to authenticated user account
   * @param {string} guestSessionKey - Guest session key
   * @param {Array<number>|null} threadIds - Optional array of specific thread IDs to link (null = all)
   * @returns {Promise<{status: string, linked_count: number, selective: boolean}>}
   */
  linkGuestThreads: async (guestSessionKey, threadIds = null) => {
    const payload = { guest_session_key: guestSessionKey };
    if (threadIds && threadIds.length > 0) {
      payload.thread_ids = threadIds;
    }

    const response = await httpClient.post("/chat/threads/link-guest-threads/", payload);
    return response.data;
  },

  getMessages: async (threadId, sessionKey = null) => {
    const params = sessionKey ? { session_key: sessionKey } : {};
    const response = await httpClient.get(`/chat/threads/${threadId}/messages/`, { params });
    return response.data;
  },

  sendMessage: async (threadId, message, sessionKey = null, attachmentIds = []) => {
    const params = sessionKey ? { session_key: sessionKey } : {};
    const response = await httpClient.post(
      `/chat/threads/${threadId}/messages/`,
      { message, attachment_ids: attachmentIds },
      { params }
    );
    return response.data;
  },

  sendOffer: async (threadId, offer, sessionKey = null) => {
    const params = sessionKey ? { session_key: sessionKey } : {};
    const offerMessage =
      offer.message?.trim() ||
      offer.description?.trim() ||
      `Offer: ${offer.title}`;
    const normalizedPrice = Number(offer.price || 0).toFixed(2);

    const response = await httpClient.post(
      `/chat/threads/${threadId}/messages/`,
      {
        message: offerMessage,
        is_offer: true,
        offer_title: offer.title,
        offer_price: normalizedPrice,
        offer_timeline: offer.timeline,
        offer_description: offer.description,
        attachment_ids: offer.attachment_ids || [],
      },
      { params }
    );
    return response.data;
  },

  updateOfferStatus: async (threadId, offerId, decision, sessionKey = null) => {
    const decisionValue =
      typeof decision === "object" && decision !== null ? decision.decision : decision;
    const clientEmail =
      typeof decision === "object" && decision !== null ? decision.clientEmail : null;
    const normalizedDecision = String(decisionValue || "").toLowerCase();
    const isAccept = normalizedDecision === "accepted" || normalizedDecision === "accept";
    const offerStatus = isAccept ? "accepted" : "rejected";
    const payload = { offer_status: offerStatus };

    if (isAccept && clientEmail) {
      payload.client_email = clientEmail;
    }

    const response = await httpClient.post(
      `/chat/threads/${threadId}/messages/${offerId}/update-offer/`,
      payload,
      sessionKey ? { params: { session_key: sessionKey } } : undefined
    );
    return response.data;
  },

  uploadFile: async (file, messageId = null, threadId = null, sessionKey = null) => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Add IDs if they exist
    if (messageId) formData.append("message_id", messageId);
    if (threadId) formData.append("message_thread_id", threadId);

    // Prepare config with headers and session_key if provided
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: sessionKey ? { session_key: sessionKey } : {},
    };

    const response = await httpClient.post("/chat/upload/", formData, config);
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await httpClient.get("/dashboard/stats/");
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await httpClient.get("/chat/unread-count/");
    return response.data;
  },

  getThreadUnreads: async () => {
    const response = await httpClient.get("/chat/thread-unreads/");
    return response.data;
  },

  getPendingOffersReceived: async () => {
    const response = await httpClient.get("/chat/pending-offers/");
    return response.data;
  },

  getPendingOffersSent: async () => {
    const response = await httpClient.get("/chat/threads/sent-offers/");
    return response.data;
  },

  getPendingOffers: async () => {
    const response = await httpClient.get("/chat/pending-offers/");
    return response.data;
  },

  initializeJobPayment: async (jobId, options = {}) => {
    const payload = {
      job_id: jobId,
      gateway: (options.gateway || "PAYD").toUpperCase(),
    };

    if (options.clientEmail) payload.client_email = options.clientEmail;
    if (options.clientPassword) payload.client_password = options.clientPassword;
    if (options.clientPasswordConfirm) {
      payload.client_password_confirm = options.clientPasswordConfirm;
    }

    const config = options.sessionKey
      ? { params: { session_key: options.sessionKey } }
      : {};

    const response = await httpClient.post(
      "/orders/payments/payd/initiate/", // 🔥 IMPORTANT FIX BELOW

      payload,
      config
    );

    return response.data;
  },

  getWebSocketUrl: (threadId, sessionKey = null) => {
    const wsHost =
      process.env.NEXT_PUBLIC_WS_HOST ||
      "remyink-9gqjd.ondigitalocean.app";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const sessionParam = sessionKey ? `?session_key=${sessionKey}` : "";
    return `${protocol}//${wsHost}/ws/chat/thread/${threadId}/${sessionParam}`;
  },

  getNewThreadWebSocketUrl: (freelancerId, sessionKey = null) => {
    const wsHost =
      process.env.NEXT_PUBLIC_WS_HOST ||
      "remyink-9gqjd.ondigitalocean.app";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const sessionParam = sessionKey ? `?session_key=${sessionKey}` : "";
    return `${protocol}//${wsHost}/ws/chat/new/${freelancerId}/${sessionParam}`;
  },
};

export default chatApi;