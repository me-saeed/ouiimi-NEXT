# Understanding DO_APP_PATH Secret

## What is `/root/ouiimi`?

`/root/ouiimi` is the **absolute file system path** on your DigitalOcean VPS where your application will be deployed.

### Breaking it down:

```
/root/ouiimi
│    │
│    └─── Folder name: "ouiimi" (your app folder)
│
└─── Root user's home directory on Linux
```

### Path Structure on Linux:

- `/` = Root of the file system
- `/root` = Home directory for the `root` user (administrator)
- `/root/ouiimi` = Your application folder inside root's home

## What Should You Set?

Based on your earlier message, you mentioned your path is `/root/ouiimi`, so:

**GitHub Secret: `DO_APP_PATH`**
- **Value:** `/root/ouiimi`

This means:
- Your app will be deployed to: `/root/ouiimi/`
- Your `package.json` will be at: `/root/ouiimi/package.json`
- Your `.env.production` should be at: `/root/ouiimi/.env.production`
- PM2 will run from: `/root/ouiimi/`

## Alternative Paths (if you want to change):

If you want to use a different location, you can set:

- `/var/www/ouiimi` - Common web server location
- `/home/ubuntu/ouiimi` - If using ubuntu user instead of root
- `/opt/ouiimi` - Common location for installed applications

## How to Check Your Current Secret:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Find `DO_APP_PATH` secret
4. Check its value

## Important Notes:

✅ **The path must exist or be creatable** - The deployment script will create it if it doesn't exist

✅ **Use absolute paths** - Always start with `/` (e.g., `/root/ouiimi`, not `root/ouiimi`)

✅ **No trailing slash** - Use `/root/ouiimi` not `/root/ouiimi/`

✅ **Must match your PM2 config** - Check `ecosystem.config.js` to ensure `cwd` matches

## Example:

If your secret is set to `/root/ouiimi`, your server structure will look like:

```
/root/
  └── ouiimi/
      ├── package.json
      ├── .env.production
      ├── app/
      ├── lib/
      ├── .next/
      ├── node_modules/
      └── logs/
```

## Quick Check:

To verify what you have set, you can check the deployment logs. The script will show:
```
APP_PATH is set to: [/root/ouiimi]
```

If you see an empty value `[]`, then the secret is not set correctly.

