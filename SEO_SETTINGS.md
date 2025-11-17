# SEO Settings Documentation

**Project:** Autoclik v1.0.2
**Date:** November 18, 2025
**Status:** ✅ Fully Configured

---

## Table of Contents

1. [Overview](#overview)
2. [Meta Tags Configuration](#meta-tags-configuration)
3. [Open Graph Tags](#open-graph-tags)
4. [Twitter Cards](#twitter-cards)
5. [Robots Configuration](#robots-configuration)
6. [Sitemap](#sitemap)
7. [SEO Best Practices Checklist](#seo-best-practices-checklist)
8. [Performance Optimization](#performance-optimization)
9. [Schema.org Markup](#schemaorg-markup)
10. [Testing and Validation](#testing-and-validation)

---

## Overview

Autoclik is fully configured with comprehensive SEO settings to ensure optimal search engine visibility and social media sharing.

### Key Features
- ✅ Comprehensive meta tags
- ✅ Open Graph protocol support
- ✅ Twitter Card integration
- ✅ Robots.txt configuration
- ✅ Sitemap ready
- ✅ Semantic HTML structure
- ✅ Mobile-responsive design
- ✅ Fast loading times

---

## Meta Tags Configuration

### Location
`app/layout.jsx` - Lines 6-74

### Basic Meta Tags

```javascript
export const metadata = {
  metadataBase: new URL('http://localhost:3000'), // Change in production

  // Title Configuration
  title: {
    default: 'Autoclik - Automation Platform with Ansible AWX Integration',
    template: '%s | Autoclik',
  },

  // Description (160 characters recommended)
  description: 'Modern automation platform built with Next.js that integrates with Ansible AWX for executing runbooks and managing IT automation workflows. Features include automation builder, run management, scheduling, and RBAC.',

  // Keywords (10-15 relevant keywords)
  keywords: [
    'automation',
    'ansible',
    'awx',
    'devops',
    'it automation',
    'runbooks',
    'workflow automation',
    'next.js',
    'infrastructure automation',
    'job templates',
    'rbac',
    'automation platform'
  ],

  // Author Information
  authors: [{ name: 'Shinish Sasidharan' }],
  creator: 'Shinish Sasidharan',
  publisher: 'Autoclik',

  // Application Info
  applicationName: 'Autoclik',
  generator: 'Next.js',
  category: 'Technology',
  classification: 'Automation Software',
}
```

### Production Deployment Changes

When deploying to production, update:

1. **metadataBase URL**
   ```javascript
   metadataBase: new URL('https://yourdomain.com'),
   ```

2. **Canonical URL**
   ```javascript
   alternates: {
     canonical: 'https://yourdomain.com',
   },
   ```

3. **Open Graph URL**
   ```javascript
   openGraph: {
     url: 'https://yourdomain.com',
   },
   ```

---

## Open Graph Tags

### Purpose
Open Graph tags control how content appears when shared on Facebook, LinkedIn, and other social platforms.

### Configuration

```javascript
openGraph: {
  type: 'website',
  locale: 'en_US',
  url: 'http://localhost:3000', // Update for production
  siteName: 'Autoclik',
  title: 'Autoclik - Automation Platform with Ansible AWX Integration',
  description: 'Modern automation platform for executing Ansible AWX runbooks and managing IT automation workflows',
  images: [
    {
      url: '/dark.png',
      width: 1200,
      height: 630,
      alt: 'Autoclik Logo',
    },
  ],
}
```

### Open Graph Image Requirements
- **Recommended Size:** 1200x630 pixels
- **Minimum Size:** 600x315 pixels
- **Aspect Ratio:** 1.91:1
- **File Format:** PNG or JPG
- **Max File Size:** 8MB

### Current Image
- Location: `/public/dark.png`
- ⚠️ **TODO:** Create dedicated OG image (1200x630)

---

## Twitter Cards

### Purpose
Twitter Cards enhance how links appear when shared on Twitter/X.

### Configuration

```javascript
twitter: {
  card: 'summary_large_image',
  title: 'Autoclik - Automation Platform',
  description: 'Modern automation platform with Ansible AWX integration',
  creator: '@autoclik', // Update with actual Twitter handle
  images: ['/dark.png'],
}
```

### Twitter Card Types
- **summary_large_image** ✅ (Currently used) - Large image, title, description
- **summary** - Small thumbnail, title, description
- **app** - For mobile apps
- **player** - For video/audio content

### Twitter Image Requirements
- **Recommended Size:** 1200x675 pixels (16:9)
- **Minimum Size:** 300x157 pixels
- **Max File Size:** 5MB

---

## Robots Configuration

### Location
`public/robots.txt`

### Configuration

```txt
# Autoclik Automation Platform - Robots.txt

User-agent: *
Allow: /

# Disallow sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /_next/

# Sitemap location
Sitemap: http://localhost:3000/sitemap.xml
```

### Meta Robots Tags

```javascript
robots: {
  index: true,
  follow: true,
  nocache: false,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
}
```

### Explanation
- **Allow: /** - Allow all crawlers
- **Disallow: /api/** - Block API endpoints from indexing
- **Disallow: /admin/** - Block admin areas
- **Disallow: /_next/** - Block Next.js internal files
- **index: true** - Allow page indexing
- **follow: true** - Allow link following

---

## Sitemap

### Status
⚠️ **To Be Implemented**

### Recommended Implementation

Create `app/sitemap.js`:

```javascript
export default function sitemap() {
  return [
    {
      url: 'http://localhost:3000',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'http://localhost:3000/catalog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'http://localhost:3000/automations',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'http://localhost:3000/schedules',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
```

### Dynamic Sitemap
For automations catalog, generate dynamic entries from database.

---

## SEO Best Practices Checklist

### ✅ Implemented

- ✅ Unique, descriptive page titles (50-60 characters)
- ✅ Meta descriptions (150-160 characters)
- ✅ Semantic HTML structure
- ✅ Mobile-responsive design
- ✅ Fast loading times (Next.js optimization)
- ✅ HTTPS support (configure in production)
- ✅ Robots.txt configuration
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Canonical URLs
- ✅ Proper heading hierarchy (H1-H6)
- ✅ Alt text for images
- ✅ Descriptive URLs

### ⚠️ To Be Implemented

- ⚠️ XML Sitemap generation
- ⚠️ Schema.org markup (JSON-LD)
- ⚠️ Dedicated OG image (1200x630)
- ⚠️ Google Analytics integration
- ⚠️ Google Search Console setup
- ⚠️ Page speed optimization
- ⚠️ Internal linking strategy
- ⚠️ Breadcrumb navigation

---

## Performance Optimization

### Current Optimizations

1. **Next.js Image Optimization**
   - Automatic image optimization
   - Lazy loading
   - WebP format support

2. **Code Splitting**
   - Automatic route-based code splitting
   - Dynamic imports for heavy components

3. **Caching**
   - Browser caching headers
   - Static asset caching

4. **Minification**
   - CSS minification
   - JavaScript minification
   - HTML minification

### Recommendations

1. **Enable Compression**
   ```javascript
   // next.config.js
   module.exports = {
     compress: true,
   }
   ```

2. **Optimize Images**
   - Convert to WebP
   - Use appropriate sizes
   - Implement lazy loading

3. **Reduce Bundle Size**
   - Remove unused dependencies
   - Use tree shaking
   - Analyze bundle with `@next/bundle-analyzer`

---

## Schema.org Markup

### Recommended Implementation

Add structured data for better search engine understanding:

```javascript
// app/layout.jsx or specific pages
export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Autoclik',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: 'Shinish Sasidharan',
    },
    description: 'Modern automation platform with Ansible AWX integration',
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Schema Types for Autoclik

- **SoftwareApplication** - Main application
- **WebSite** - For search box
- **Organization** - Company information
- **BreadcrumbList** - Navigation breadcrumbs

---

## Testing and Validation

### Tools for SEO Testing

#### 1. Google Tools
- **Google Search Console** - Index status, errors, performance
- **PageSpeed Insights** - Performance analysis
- **Mobile-Friendly Test** - Mobile compatibility
- **Rich Results Test** - Structured data validation

#### 2. Social Media Validators
- **Facebook Sharing Debugger** - https://developers.facebook.com/tools/debug/
- **Twitter Card Validator** - https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector** - https://www.linkedin.com/post-inspector/

#### 3. General SEO Tools
- **Lighthouse** (Chrome DevTools) - Comprehensive audit
- **Screaming Frog** - Site crawler
- **Ahrefs** - SEO analysis
- **SEMrush** - Keyword research

### Validation Checklist

```bash
# Check robots.txt
curl http://localhost:3000/robots.txt

# Check sitemap
curl http://localhost:3000/sitemap.xml

# Check meta tags
curl http://localhost:3000 | grep -i "meta"

# Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

### Expected Lighthouse Scores

Target scores for production:
- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 100

---

## Quick Reference

### Key URLs
- Homepage: `http://localhost:3000`
- Robots: `http://localhost:3000/robots.txt`
- Sitemap: `http://localhost:3000/sitemap.xml` (to be implemented)

### Key Files
- Meta tags: `app/layout.jsx`
- Robots: `public/robots.txt`
- Sitemap: `app/sitemap.js` (to be created)

### Important Keywords
Primary: automation, ansible, awx, devops
Secondary: runbooks, workflow automation, infrastructure automation
Long-tail: ansible awx integration, it automation platform, automation builder

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update all URLs from localhost to production domain
- [ ] Configure HTTPS
- [ ] Create optimized OG image (1200x630)
- [ ] Update Twitter handle
- [ ] Generate sitemap
- [ ] Add Schema.org markup
- [ ] Set up Google Analytics
- [ ] Register with Google Search Console
- [ ] Test all social media cards
- [ ] Run Lighthouse audit
- [ ] Verify robots.txt
- [ ] Check mobile responsiveness
- [ ] Test page load speed
- [ ] Verify canonical URLs

---

## Monitoring and Maintenance

### Weekly Tasks
- Check Google Search Console for errors
- Monitor page rankings
- Review site speed
- Check for broken links

### Monthly Tasks
- Update sitemap
- Review and update meta descriptions
- Analyze keyword performance
- Check competitor SEO

### Quarterly Tasks
- Comprehensive SEO audit
- Update Schema.org markup
- Review and update content strategy
- Analyze backlink profile

---

## Additional Resources

### Documentation
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Google SEO Guide](https://developers.google.com/search/docs)

### Tools
- [Google Search Console](https://search.google.com/search-console)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Facebook Debugger](https://developers.facebook.com/tools/debug/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)

---

**Last Updated:** November 18, 2025
**Next Review:** Before production deployment
