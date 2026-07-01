// Browser-safe Supabase configuration.
// Only use a publishable key here. Never add a secret or service_role key.
export const supabaseConfig = Object.freeze({
  url: "https://fadxptyoqmhquxesurtp.supabase.co",
  publishableKey: "sb_publishable_xxxxxxxxxxxxxxxxx",
  schema: 'public',
  auth: Object.freeze({
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }),
  resources: Object.freeze({
    tables: Object.freeze({
      languages: 'languages',
      news: 'news',
      newsCategories: 'news_categories',
      newsCategoryLocalizations: 'news_category_localizations',
      newsLocalizations: 'news_localizations',
      ads: 'ads',
      adSlots: 'ad_slots',
      adDailyStats: 'ad_daily_stats',
      submissions: 'submissions',
      pages: 'pages',
      translations: 'translations',
      settings: 'site_settings',
      heroContent: 'hero_content',
      newsItems: 'news_items',
      trackerData: 'tracker_data',
      sectionCards: 'section_cards',
      sponsoredAds: 'sponsored_ads',
      contactSettings: 'contact_settings',
      mediaAssets: 'media_assets'
    }),
    buckets: Object.freeze({
      media: 'media',
      ads: 'ads',
      submissions: 'submissions'
    })
  }),
  realtime: Object.freeze({
    channelPrefix: 'turkua-admin',
    schema: 'public'
  })
});
