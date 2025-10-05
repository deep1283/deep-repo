# DukhiAtma - Group Chat with AI Therapist

A supportive group chat application with an AI therapist (@chad) for heartbroken friends to heal together.

## Features

- 🔐 **Google OAuth Authentication** via Supabase
- 💬 **Real-time Group Chat** with WhatsApp-style interface
- 🤖 **AI Therapist (@chad)** powered by OpenAI GPT
- 👑 **Admin Controls** for user management
- 📱 **Mobile-friendly** responsive design
- 🎨 **Modern UI** with soothing color scheme

## Quick Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
GOOGLE_API_KEY=your_google_api_key_here
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email_here
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Go to Authentication > Providers and enable Google OAuth
3. Run the SQL schema from `supabase-schema.sql` in the SQL Editor
4. Copy your project URL and anon key to `.env.local`

### 3. OpenAI Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file

### 4. Run the Application

```bash
npm install
npm run dev
```

## Usage

1. **Login**: Users authenticate with Google OAuth
2. **Chat**: All users join a single group chat
3. **AI Therapist**: Mention `@chad` in messages to get therapeutic responses
4. **Admin Controls**: Admin can remove users from the chat
5. **Removed Users**: Redirected to a "You have been removed" page

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_API_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`

## Color Scheme

- **Background**: `#f9fafc` (Light gray)
- **User Messages**: `#6c63ff` (Purple-blue)
- **Friend Messages**: `#e0e7ff` (Soft lavender)
- **AI Messages**: `#ffcaaf` (Peach)
- **Send Button**: `#6c63ff` (Purple-blue)

## Disposable Design

This app is designed to be easily disposable:

- All data stored in Supabase (can be deleted)
- No persistent local storage
- Simple to remove from Vercel
- Easy to delete the entire project

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **AI**: OpenAI GPT-3.5-turbo
- **Icons**: Lucide React
- **Deployment**: Vercel

## Support

For issues or questions, please check the console logs and ensure all environment variables are properly set.
