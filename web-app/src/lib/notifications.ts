/**
 * Production-safe notification system
 * Replaces alert() with proper toast notifications
 */

// Simple toast notification for critical messages
export function showNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
  // Check if sonner toast is available (from admin page)
  if (typeof window !== 'undefined') {
    // Try to use existing toast system if available
    const toastEvent = new CustomEvent('show-toast', {
      detail: { message, type }
    });
    window.dispatchEvent(toastEvent);

    // Fallback to browser notification if toast not available
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Ottokode', { body: message });
      } else {
        // Last resort: use a styled modal instead of alert
        showModalNotification(message, type);
      }
    }, 100);
  }
}

// Create a styled modal notification instead of alert()
function showModalNotification(message: string, type: 'info' | 'warning' | 'error'): void {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';

  const content = document.createElement('div');
  content.className = `bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md mx-4 border-l-4 ${
    type === 'error' ? 'border-red-500' :
    type === 'warning' ? 'border-yellow-500' :
    'border-blue-500'
  }`;

  const title = document.createElement('h3');
  title.className = 'text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100';
  title.textContent = type === 'error' ? 'Error' :
                     type === 'warning' ? 'Warning' :
                     'Information';

  const text = document.createElement('p');
  text.className = 'text-gray-700 dark:text-gray-300 mb-4';
  text.textContent = message;

  const button = document.createElement('button');
  button.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
  button.textContent = 'OK';
  button.onclick = () => modal.remove();

  content.appendChild(title);
  content.appendChild(text);
  content.appendChild(button);
  modal.appendChild(content);

  document.body.appendChild(modal);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (modal.parentNode) {
      modal.remove();
    }
  }, 10000);
}

// Request notification permission on app start
export function initializeNotifications(): void {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}