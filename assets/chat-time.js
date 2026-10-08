/* Store UTC instants; the viewer's device supplies the timezone for every label. */
(function (root) {
  const ChatTime = {
    dayKey(iso) {
      const date = new Date(iso);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    },
    clock(iso) {
      return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
    },
    day(iso) {
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
    },
    full(iso) {
      return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'long' }).format(new Date(iso));
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ChatTime;
  else root.ChatTime = ChatTime;
})(typeof window !== 'undefined' ? window : globalThis);
