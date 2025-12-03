# Chat Header and Profile Picture Location

## 📍 Where is the Chat Header?

The chat header is located at the **top of the ChatWindow component** and appears in two versions:

### 1. **Mobile Header** (for screens < 768px)
- **Location**: `frontend/src/pages/ChatWindow.tsx` - Lines **716-944**
- **Visibility**: `flex md:hidden` - Visible on mobile, hidden on desktop
- **Position**: Sticky at the top (`sticky top-0`)
- **Height**: 60px (`h-[60px]`)
- **Background**: White with border bottom

### 2. **Desktop Header** (for screens ≥ 768px)
- **Location**: `frontend/src/pages/ChatWindow.tsx` - Lines **946+**
- **Visibility**: `hidden md:flex` - Hidden on mobile, visible on desktop
- **Height**: 60px (`h-[60px]`)
- **Background**: White with border bottom

## 📸 Where is the Profile Picture?

The profile picture/avatar is displayed **inside the chat header**:

### Mobile Header (Lines 729-742):
```tsx
{picture ? (
    <img
        src={picture}
        alt={name}
        className="w-9 h-9 rounded-full object-cover mr-3 flex-shrink-0"
    />
) : (
    <div className="...avatar with initials...">
        {getInitials(name)}
    </div>
)}
```

### Desktop Header (Lines 959-972):
```tsx
{picture ? (
    <img
        src={picture}
        alt={name}
        className="w-9 h-9 rounded-full object-cover mr-3 flex-shrink-0"
    />
) : (
    <div className="...avatar with initials...">
        {getInitials(name)}
    </div>
)}
```

## 🎨 Header Components

Both headers contain:

1. **Back Button** (←) - Navigate back
2. **Profile Picture/Avatar**:
   - If `profilePicture` exists → Shows image
   - If no picture → Shows colored circle with initials
   - Size: 36px × 36px (`w-9 h-9`)
   - Shape: Circular (`rounded-full`)
3. **Name** - Chat partner or group name
4. **Status** - "Online" or "typing..." indicator
5. **Phone Icon** - Contact info button
6. **Menu Icon** (⋮) - Options menu

## 🔍 Profile Picture Source

The profile picture comes from:
- **Individual chats**: `(chatInfo as User).profilePicture`
- **Group chats**: `(chatInfo as Group).picture`
- **Location in code**: Line 684 in `ChatWindow.tsx`

## 🛠️ Profile Picture URL Handling

Profile pictures are automatically converted to full URLs:
- If URL starts with `/` → Converts to `http://hostname:3001/uploads/...`
- If URL is already full (`http://` or `https://`) → Used as-is
- If no picture → Shows avatar with initials

## 📱 Visibility Rules

- **Mobile**: Header visible on screens < 768px
- **Desktop**: Header visible on screens ≥ 768px
- **Z-index**: `z-50` to ensure it stays on top
- **Position**: `sticky top-0` on mobile for better UX

## 🐛 Troubleshooting

### Header not visible?
1. Check screen size - mobile/desktop headers are separate
2. Check z-index - should be `z-50`
3. Check if `chatInfo` is loaded - header needs chat data
4. Check browser console for errors

### Profile picture not showing?
1. Check if `profilePicture` exists in user/group data
2. Check if URL is properly formatted (should be full URL)
3. Check browser network tab for 404 errors
4. Check if image file exists in `backend/uploads/` directory
5. If image fails, avatar with initials will show automatically

### Picture shows as broken image?
- The code now handles this automatically
- If image fails to load, it falls back to initials avatar
- Check backend uploads directory and file permissions
