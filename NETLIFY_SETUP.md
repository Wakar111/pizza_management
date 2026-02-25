# Netlify Environment Variables Setup

## Required Environment Variables

Your Netlify Functions require the following environment variables to be configured in your Netlify dashboard:

### Frontend Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Your frontend URL for CORS security | `https://crusty-pizzas.netlify.app` |

### Email Configuration (SMTP)

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port (587 for TLS, 465 for SSL) | `587` |
| `EMAIL_USER` | Email address for sending emails | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Email password or app-specific password | `your-app-password` |

### Restaurant Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `OWNER_EMAIL` | Restaurant owner's email to receive order notifications | `owner@restaurant.com` |
| `RESTAURANT_PHONE` | Restaurant contact phone number | `06022 2656947` |

## How to Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** → **Environment variables**
4. Click **Add a variable** or **Add environment variables**
5. Add each variable with its corresponding value
6. Click **Save**
7. Redeploy your site for changes to take effect

## Gmail Setup (Recommended)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Use this password for `EMAIL_PASSWORD`
3. Use these settings:
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587` (or `465` for SSL)

## Other Email Providers

- **Outlook/Hotmail**: `smtp-mail.outlook.com`, Port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, Port `587`
- **Custom SMTP**: Use your provider's SMTP settings

## Testing

After setting up the environment variables, test your functions:

```bash
# Test health endpoint
curl https://your-site.netlify.app/.netlify/functions/health

# Test order email (replace with actual data)
curl -X POST https://your-site.netlify.app/.netlify/functions/send-order-emails \
  -H "Content-Type: application/json" \
  -d '{"customer_email":"test@example.com","customer_name":"Test User","items":[]}'
```
