# Where Are Old Chats Stored?

## 📍 Chat Message Storage

### Database Location
All chat messages (old and new) are stored in the **PostgreSQL database** in the `Message` table.

**Database Path:**
- **Backend**: `backend/prisma/schema.prisma` defines the Message model
- **Database**: PostgreSQL (configured in `DATABASE_URL` environment variable)
- **Table**: `Message`

### Message Storage Details

1. **Individual Chats** (1-on-1 messages):
   - Stored with `senderId` and `receiverId`
   - Retrieved via: `GET /chat/messages/:userId/:otherUserId`
   - Location: `backend/src/modules/chat/chat.service.ts` → `getMessages()`

2. **Group Chats**:
   - Stored with `groupId`
   - Retrieved via: `GET /chat/group/:groupId/messages`
   - Location: `backend/src/modules/chat/chat.service.ts` → `getGroupMessages()`

3. **All Messages** (for a user or group):
   - Retrieved via: `GET /files/messages?userId=...` or `GET /files/messages?groupId=...`
   - Location: `backend/src/modules/files/files.service.ts` → `getAllMessages()`
   - Returns up to 1000 most recent messages

### How Messages Are Retrieved

#### Frontend (ChatWindow.tsx)
```typescript
// Individual chat
GET /chat/messages/{currentUserId}/{otherUserId}

// Group chat  
GET /chat/group/{groupId}/messages
```

#### Backend Services
1. **ChatService.getMessages()** - Gets messages between two users (limit: 50 by default)
2. **ChatService.getGroupMessages()** - Gets messages in a group (limit: 50 by default)
3. **FilesService.getAllMessages()** - Gets all messages for a user/group (limit: 1000)

### Message Filtering

Messages are filtered by:
- `isDeleted: false` - Only non-deleted messages
- `deletedFor` - Array of user IDs who deleted the message (excluded for those users)
- Date range: Messages are ordered by `createdAt` (newest first in getAllMessages, oldest first in getMessages)

### Accessing Old Chats

#### Method 1: Through the App UI
1. Open the chat with the person/group
2. Scroll up to load older messages
3. Messages are loaded automatically as you scroll

#### Method 2: API Endpoint
```bash
# Get all messages for a user
GET http://localhost:3001/files/messages?userId={userId}

# Get all messages for a group
GET http://localhost:3001/files/messages?groupId={groupId}
```

#### Method 3: Database Query
```sql
-- Get all messages between two users
SELECT * FROM "Message" 
WHERE (("senderId" = 'user1-id' AND "receiverId" = 'user2-id') 
    OR ("senderId" = 'user2-id' AND "receiverId" = 'user1-id'))
AND "isDeleted" = false
ORDER BY "createdAt" DESC;

-- Get all messages in a group
SELECT * FROM "Message" 
WHERE "groupId" = 'group-id'
AND "isDeleted" = false
ORDER BY "createdAt" DESC;
```

### Message Data Structure

Each message contains:
- `id` - Unique message ID
- `content` - Message text
- `senderId` - Who sent it
- `receiverId` - Who received it (for 1-on-1)
- `groupId` - Group ID (for group chats)
- `createdAt` - When it was sent
- `attachments` - Files/images attached
- `voiceNote` - Voice message
- `reactions` - Emoji reactions
- `replyToId` - If it's a reply to another message
- `forwardedFromId` - If forwarded (after migration)
- `forwardedFromMessageId` - Original message ID (after migration)

### Notes

- **No messages are permanently deleted** - They're marked as `isDeleted: true`
- **Messages are stored indefinitely** - No automatic cleanup
- **Pagination**: Default limit is 50 messages per request
- **Real-time updates**: New messages come via WebSocket (Socket.IO)

## 🔧 Troubleshooting

### Can't see old messages?
1. Check if messages are marked as deleted: `isDeleted = false`
2. Check if you're in the deletedFor list
3. Verify the chat ID is correct
4. Check backend logs for errors

### Need to recover deleted messages?
- Check database directly: `SELECT * FROM "Message" WHERE "isDeleted" = true`
- Messages are soft-deleted, so they still exist in the database
