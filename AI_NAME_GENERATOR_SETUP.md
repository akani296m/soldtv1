# AI Store Name Generator Setup Guide

This feature uses OpenAI GPT-4o-mini to generate creative store name suggestions during the merchant onboarding flow.

## How It Works

1. **User clicks "Let AI help me"** button on the store naming step (Step 3)
2. **API call is made** to `/api/generate-names` (Vercel Edge Function)
3. **OpenAI generates 5 creative names** based on the merchant's onboarding context
4. **Suggestions appear** as clickable pills below the input field
5. **User clicks a name** → it fills the input field and suggestions disappear
6. **User confirms** → proceeds to store creation

## Setup Instructions

### 1. Add OpenAI API Key to Vercel

You need to add your OpenAI API key as an environment variable in Vercel:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`merchantsv1`)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
   - **Environment**: Production, Preview, and Development
5. Click **Save**

### 2. Get an OpenAI API Key (if you don't have one)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again!)

### 3. Redeploy Your App

After adding the environment variable:

```bash
# If using Vercel CLI
vercel --prod

# Or just push to your main branch and it will auto-deploy
git add .
git commit -m "Add AI store name generator"
git push
```

## Local Development Testing

For local testing with the Vercel dev server:

1. Create a `.env.local` file (already gitignored):
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

2. Run with Vercel CLI:
   ```bash
   npx vercel dev
   ```

> **Note**: The regular `npm run dev` (Vite) won't work with the API route since it doesn't run Vercel serverless functions. You need to use `vercel dev` for local testing of the API.

## Files Created/Modified

| File | Description |
|------|-------------|
| `/api/generate-names.js` | Vercel Edge Function that calls OpenAI API |
| `/src/pages/onboarding.jsx` | Updated with AI name generation UI |
| `/vercel.json` | Updated to properly route API calls |

## Cost Considerations

- Uses **GPT-4o-mini** model which is very cost-effective
- Each name generation request uses ~200-300 tokens
- Estimated cost: **$0.0001 - $0.0003 per request**
- At 1,000 new merchants/month: ~$0.10-0.30/month

## Troubleshooting

### "OpenAI API key not configured" error
- Make sure you added `OPENAI_API_KEY` to Vercel environment variables
- Redeploy the app after adding the variable

### "Unable to generate suggestions" error
- Check the Vercel function logs for detailed error messages
- Verify your OpenAI API key is valid and has credits

### Suggestions not appearing
- Open browser DevTools → Network tab
- Look for the `/api/generate-names` request
- Check the response for any errors
