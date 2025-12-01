export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE'
}

export enum AccountState {
    ACTIVE = 'ACTIVE',
    DEACTIVATED = 'DEACTIVATED'
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    jobTitle: string;
    department: string;
    role: string; // Using string to match backend response
    accountState: string;
    profilePicture?: string;
    isOnline: boolean;
    lastSeen?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    content?: string;
    senderId: string;
    receiverId?: string;
    groupId?: string;
    replyToId?: string;
    isPinned: boolean;
    isDeleted: boolean;
    deletedFor?: string; // JSON array of user IDs who deleted this message
    createdAt: string;
    updatedAt: string;
    deliveredAt?: string;
    seenAt?: string;

    // Relations
    sender?: User;
    receiver?: User;
    replyTo?: Message;
    attachments?: Attachment[];
    reactions?: Reaction[];
    voiceNote?: VoiceNote;
}

export interface Group {
    id: string;
    name: string;
    picture?: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;

    // Relations
    createdBy?: User;
    members?: GroupMember[];
    lastMessage?: Message;
}

export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    role: 'admin' | 'member';
    joinedAt: string;

    // Relations
    user?: User;
}

export interface Attachment {
    id: string;
    messageId: string;
    type: 'IMAGE' | 'VIDEO' | 'PDF' | 'WORD' | 'OTHER';
    url: string;
    filename: string;
    size: number;
    createdAt: string;
}

export interface Reaction {
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    createdAt: string;

    // Relations
    user?: User;
}

export interface VoiceNote {
    id: string;
    messageId: string;
    url: string;
    duration: number;
    createdAt: string;
}

export interface ChatPreview {
    id: string; // userId or groupId
    name: string;
    picture?: string;
    lastMessage?: Message;
    unreadCount: number;
    isGroup: boolean;
    isOnline?: boolean;
    typing?: boolean;
    user?: User; // Added user for individual chats
}

export interface Notification {
    id: string;
    userId: string;
    type: 'MESSAGE' | 'REPLY' | 'MENTION' | 'GROUP_ADD' | 'GROUP_REMOVE' | 'SYSTEM';
    title: string;
    content: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}
