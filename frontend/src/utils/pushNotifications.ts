// Push notification service for PWA
export class PushNotificationService {
    private static registration: ServiceWorkerRegistration | null = null;

    static async initialize() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                this.registration = registration;
                return registration;
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
        return null;
    }

    static async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission;
        }

        return Notification.permission;
    }

    static async subscribe(): Promise<PushSubscription | null> {
        if (!this.registration) {
            await this.initialize();
        }

        if (!this.registration) {
            return null;
        }

        try {
            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey ? this.urlBase64ToUint8Array(vapidKey) as BufferSource : undefined,
            });
            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return null;
        }
    }

    static async showNotification(title: string, options?: NotificationOptions) {
        if (Notification.permission === 'granted') {
            if (this.registration) {
                await this.registration.showNotification(title, {
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    ...options,
                });
            } else {
                new Notification(title, {
                    icon: '/pwa-192x192.png',
                    ...options,
                });
            }
        }
    }

    private static urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

