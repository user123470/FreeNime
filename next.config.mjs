/** @type {import('next').NextConfig} */
export default {
  images: { remotePatterns: [
    { protocol: 'https', hostname: 's4.anilist.co' },
    { protocol: 'https', hostname: 'cdn.myanimelist.net' },
    { protocol: 'https', hostname: '*.supabase.co' }
  ] }
};
