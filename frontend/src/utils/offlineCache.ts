// Offline caching with IndexedDB

const DB_NAME = 'EverlastIntranetDB';
const DB_VERSION = 1;
const STORES = {
    MESSAGES: 'messages',
    USERS: 'users',
    GROUPS: 'groups',
    QUEUE: 'messageQueue',
};

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Messages store
            if (!database.objectStoreNames.contains(STORES.MESSAGES)) {
                const messageStore = database.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
                messageStore.createIndex('chatId', 'chatId', { unique: false });
                messageStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Users store
            if (!database.objectStoreNames.contains(STORES.USERS)) {
                database.createObjectStore(STORES.USERS, { keyPath: 'id' });
            }

            // Groups store
            if (!database.objectStoreNames.contains(STORES.GROUPS)) {
                database.createObjectStore(STORES.GROUPS, { keyPath: 'id' });
            }

            // Message queue for offline messages
            if (!database.objectStoreNames.contains(STORES.QUEUE)) {
                const queueStore = database.createObjectStore(STORES.QUEUE, { keyPath: 'id', autoIncrement: true });
                queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
};

export const cacheMessage = async (message: any, chatId: string): Promise<void> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.MESSAGES], 'readwrite');
    const store = transaction.objectStore(STORES.MESSAGES);
    
    await store.put({ ...message, chatId });
};

export const getCachedMessages = async (chatId: string): Promise<any[]> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.MESSAGES], 'readonly');
    const store = transaction.objectStore(STORES.MESSAGES);
    const index = store.index('chatId');
    
    return new Promise((resolve, reject) => {
        const request = index.getAll(chatId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const cacheUser = async (user: any): Promise<void> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.USERS], 'readwrite');
    const store = transaction.objectStore(STORES.USERS);
    
    await store.put(user);
};

export const getCachedUsers = async (): Promise<any[]> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.USERS], 'readonly');
    const store = transaction.objectStore(STORES.USERS);
    
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const cacheGroup = async (group: any): Promise<void> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.GROUPS], 'readwrite');
    const store = transaction.objectStore(STORES.GROUPS);
    
    await store.put(group);
};

export const getCachedGroups = async (): Promise<any[]> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.GROUPS], 'readonly');
    const store = transaction.objectStore(STORES.GROUPS);
    
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const queueMessage = async (message: any): Promise<number> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.QUEUE);
    
    return new Promise((resolve, reject) => {
        const request = store.add({
            ...message,
            timestamp: Date.now(),
        });
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
};

export const getQueuedMessages = async (): Promise<any[]> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.QUEUE);
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
        const request = index.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const removeQueuedMessage = async (id: number): Promise<void> => {
    const database = await initDB();
    const transaction = database.transaction([STORES.QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.QUEUE);
    
    await store.delete(id);
};

export const clearCache = async (): Promise<void> => {
    const database = await initDB();
    const stores = [STORES.MESSAGES, STORES.USERS, STORES.GROUPS, STORES.QUEUE];
    
    for (const storeName of stores) {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
    }
};

