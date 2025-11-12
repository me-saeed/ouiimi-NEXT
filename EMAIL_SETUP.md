# Email Service Setup - Mailjet Integration

## Overview

The project uses Mailjet for sending transactional emails. The service is fully integrated and ready to use.

## Configuration

Mailjet credentials are configured in `.env.local`:

```env
MAILJET_API_KEY=6c5afba9421a25308809ce27ee20a7df
MAILJET_SECRET_KEY=46413525c090257962796ac7c3e2ef46
MAILJET_FROM_EMAIL=noreply@ouiimi.com
MAILJET_FROM_NAME=Ouiimi
```

## Email Templates

### Welcome Email
- **Location**: `app/templetes/welcome Email.html`
- **Trigger**: Sent automatically when a new user signs up
- **Placeholders**: 
  - `[First Name]` - Replaced with user's first name
  - `[FIRST_NAME]` - Replaced with user's first name
  - `[EMAIL]` - Replaced with user's email

### Password Reset Email
- **Template**: Generated dynamically with MERN app styling
- **Trigger**: Sent when user requests password reset
- **Content**: Includes reset link valid for 15 minutes

## Implementation

### Service Location
- **File**: `lib/services/mailjet.ts`
- **Function**: `sendEmail(emailToSend, subject, data, templateType)`

### Usage Examples

#### Welcome Email (Automatic on Signup)
```typescript
await sendEmail(
  [user.email],
  "Welcome to Ouiimi",
  {
    fname: user.fname,
    email: user.email,
  },
  "welcome"
);
```

#### Password Reset Email
```typescript
await sendEmail(
  [user.email],
  "Password Reset Request - Ouiimi",
  {
    fname: user.fname,
    email: user.email,
    uniquelink: resetLink,
  },
  "forget_password"
);
```

## Email Features

1. **Welcome Email**: 
   - Sent automatically on user signup
   - Uses HTML template from `app/templetes/welcome Email.html`
   - Personalized with user's first name

2. **Password Reset Email**:
   - Sent when user requests password reset
   - Includes secure reset link
   - Link expires in 15 minutes

## Template Customization

To customize the welcome email:
1. Edit `app/templetes/welcome Email.html`
2. Use placeholders: `[First Name]`, `[FIRST_NAME]`, `[EMAIL]`
3. The system will automatically replace them

## Testing

To test email functionality:
1. Sign up a new user - welcome email will be sent
2. Request password reset - reset email will be sent
3. Check Mailjet dashboard for delivery status

## Troubleshooting

### Emails Not Sending
1. Verify Mailjet credentials in `.env.local`
2. Check Mailjet account status
3. Verify sender email is verified in Mailjet
4. Check server logs for error messages

### Template Not Loading
1. Verify template file exists at `app/templetes/welcome Email.html`
2. Check file permissions
3. System will use fallback template if file can't be read

## Mailjet Dashboard

Monitor email delivery:
- Login to [Mailjet Dashboard](https://app.mailjet.com/)
- View email statistics and delivery status
- Check bounce and spam reports

## Security Notes

- Email credentials are stored in `.env.local` (not committed to git)
- Reset links expire after 15 minutes
- Email sending failures don't block user registration

