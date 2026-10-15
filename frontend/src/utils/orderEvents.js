// Cross-tab real-time order event dispatcher using standard BroadcastChannel
export const broadcastOrderEvent = (type, orderId, extra = {}) => {
  if (typeof window !== "undefined" && window.BroadcastChannel) {
    try {
      const channel = new BroadcastChannel("bitego_order_events");
      channel.postMessage({ type, orderId, timestamp: Date.now(), ...extra });
      channel.close();
    } catch {
      // Graceful fallback if BroadcastChannel is blocked
    }
  }
};
