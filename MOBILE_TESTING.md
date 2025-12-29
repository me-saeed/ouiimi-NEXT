# Mobile Testing on Local Network

This guide explains how to test your Next.js app on a mobile device using your local network.

## Quick Setup

### Step 1: Find Your Computer's Local IP Address

**On macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for an IP like `192.168.x.x` or `10.0.x.x`

**Alternative method:**
```bash
ipconfig getifaddr en0
```

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually `192.168.x.x`)

**On Linux:**
```bash
hostname -I
```

### Step 2: Create `.env.local` File

Create a `.env.local` file in the root directory with your local IP:

```env
# Replace YOUR_LOCAL_IP with your actual IP (e.g., 192.168.1.100)
NEXT_PUBLIC_SITE_URL=http://YOUR_LOCAL_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
NEXTAUTH_URL=http://YOUR_LOCAL_IP:3000
```

**Example:**
```env
NEXT_PUBLIC_SITE_URL=http://192.168.1.100:3000
NEXT_PUBLIC_API_URL=http://192.168.1.100:3000
NEXTAUTH_URL=http://192.168.1.100:3000
```

### Step 3: Start the Dev Server for Mobile Testing

Use the new mobile-friendly dev script:

```bash
npm run dev:mobile
```

Or manually:
```bash
next dev -H 0.0.0.0
```

The `-H 0.0.0.0` flag makes the server accessible from other devices on your network (not just localhost).

### Step 4: Access from Your Mobile Device

1. Make sure your mobile device is connected to the **same Wi-Fi network** as your computer
2. Open a browser on your mobile device
3. Navigate to: `http://YOUR_LOCAL_IP:3000`
   - Example: `http://192.168.1.100:3000`

## Troubleshooting

### API calls still not working?

1. **Check firewall settings** - Make sure port 3000 is not blocked
   - macOS: System Settings → Network → Firewall → Options
   - Windows: Windows Defender Firewall → Allow an app

2. **Verify IP address** - Your IP might have changed. Run the IP command again.

3. **Check network** - Ensure both devices are on the same Wi-Fi network

4. **Clear browser cache** - Sometimes cached localhost URLs cause issues

### Port already in use?

If port 3000 is busy, you can use a different port:
```bash
next dev -H 0.0.0.0 -p 3001
```

Then update `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://YOUR_LOCAL_IP:3001
NEXT_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001
NEXTAUTH_URL=http://YOUR_LOCAL_IP:3001
```

### Still having issues?

- Make sure you restarted the dev server after creating/updating `.env.local`
- Check browser console on mobile for any error messages
- Verify the server is running and accessible by checking `http://YOUR_LOCAL_IP:3000` on your computer's browser first

## Notes

- The `.env.local` file is gitignored, so it won't be committed to your repository
- For production, you'll use your actual domain name instead of the local IP
- This setup is only for local development/testing

