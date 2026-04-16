# ROTD Schema Markup Snippets
Schema JSON-LD blocks to add inside `<head>` of each page.
Paste inside a `<script type="application/ld+json">` tag.

---

## sales-page.html (WebSite + Organization)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://raceoftheday.co.uk/#organization",
      "name": "Race Of The Day",
      "url": "https://raceoftheday.co.uk",
      "description": "UK horse racing tipster service. Selective daily selections with verified 12-month P&L record.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "hello@raceoftheday.co.uk"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://raceoftheday.co.uk/#website",
      "url": "https://raceoftheday.co.uk",
      "name": "Race Of The Day",
      "publisher": { "@id": "https://raceoftheday.co.uk/#organization" }
    },
    {
      "@type": "Product",
      "name": "Race Of The Day Membership",
      "description": "Daily horse racing selections, 2–7 tips per racing day, full verified P&L record.",
      "url": "https://raceoftheday.co.uk",
      "brand": { "@id": "https://raceoftheday.co.uk/#organization" },
      "offers": [
        {
          "@type": "Offer",
          "name": "Founding Member - Monthly",
          "price": "19.00",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/LimitedAvailability",
          "url": "https://raceoftheday.co.uk/#pricing"
        },
        {
          "@type": "Offer",
          "name": "Trial Week",
          "price": "1.00",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
          "url": "https://raceoftheday.co.uk/#pricing"
        }
      ]
    }
  ]
}
```

---

## grand-national-2026.html (SportEvent + Article)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SportsEvent",
      "name": "2026 Randox Grand National",
      "startDate": "2026-04-11",
      "location": {
        "@type": "Place",
        "name": "Aintree Racecourse",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Liverpool",
          "addressCountry": "GB"
        }
      },
      "description": "The 2026 Randox Grand National Handicap Chase, 4m 2½f, 34 runners. Won by I Am Maximus (W P Mullins / Paul Townend).",
      "winner": {
        "@type": "Person",
        "name": "I Am Maximus"
      }
    },
    {
      "@type": "Article",
      "headline": "2026 Grand National Result & Full Analysis",
      "datePublished": "2026-04-11",
      "dateModified": "2026-04-16",
      "author": {
        "@id": "https://raceoftheday.co.uk/#organization"
      },
      "publisher": {
        "@id": "https://raceoftheday.co.uk/#organization"
      },
      "url": "https://raceoftheday.co.uk/grand-national-2026",
      "description": "Full result, race analysis and market review for the 2026 Randox Grand National. I Am Maximus wins at 9/2 for Willie Mullins and Paul Townend."
    }
  ]
}
```

---

## craven-stakes-2026-preview.html (Article + SportsEvent)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SportsEvent",
      "name": "Craven Stakes 2026",
      "startDate": "2026-04-16T15:35:00+01:00",
      "location": {
        "@type": "Place",
        "name": "Newmarket Racecourse (Rowley Mile)",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Newmarket",
          "addressCountry": "GB"
        }
      },
      "description": "Betway Craven Stakes, Group 3, 1 mile, Good ground. Newmarket Rowley Mile, 16 April 2026."
    },
    {
      "@type": "Article",
      "headline": "Craven Stakes 2026 Preview & Tips - Newmarket",
      "datePublished": "2026-04-16",
      "author": { "@id": "https://raceoftheday.co.uk/#organization" },
      "publisher": { "@id": "https://raceoftheday.co.uk/#organization" },
      "url": "https://raceoftheday.co.uk/craven-stakes-2026",
      "description": "Craven Stakes 2026 preview. Hawk Mountain, Hidden Force and Avicenna head the Classic trials field at Newmarket."
    }
  ]
}
```

---

## trainer-profile-willie-mullins.html (Article + Person)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "name": "Willie Mullins",
      "jobTitle": "Horse Racing Trainer",
      "worksFor": {
        "@type": "Organization",
        "name": "Closnamore Racing Stables",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Bagenalstown",
          "addressRegion": "County Carlow",
          "addressCountry": "IE"
        }
      }
    },
    {
      "@type": "Article",
      "headline": "Willie Mullins Trainer Profile 2026 - Statistics, Record & Analysis",
      "datePublished": "2026-04-16",
      "dateModified": "2026-04-16",
      "author": { "@id": "https://raceoftheday.co.uk/#organization" },
      "publisher": { "@id": "https://raceoftheday.co.uk/#organization" },
      "url": "https://raceoftheday.co.uk/trainer-profiles/willie-mullins",
      "description": "Willie Mullins trainer profile 2026. Dominant force in jump racing. Grand National winner with I Am Maximus. Full statistics and key horses."
    }
  ]
}
```

---

## trainer-profile-dan-skelton.html (Article + Person)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "name": "Dan Skelton",
      "jobTitle": "Horse Racing Trainer",
      "worksFor": {
        "@type": "Organization",
        "name": "Lodge Hill Racing Stables",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Shelfield",
          "addressRegion": "Warwickshire",
          "addressCountry": "GB"
        }
      }
    },
    {
      "@type": "Article",
      "headline": "Dan Skelton Trainer Profile 2026 - Statistics, Record & Analysis",
      "datePublished": "2026-04-16",
      "dateModified": "2026-04-16",
      "author": { "@id": "https://raceoftheday.co.uk/#organization" },
      "publisher": { "@id": "https://raceoftheday.co.uk/#organization" },
      "url": "https://raceoftheday.co.uk/trainer-profiles/dan-skelton",
      "description": "Dan Skelton trainer profile 2026. Britain's leading jumps trainer challenger. Cheltenham A/E 1.17, Aintree +29.85 profit from live API data."
    }
  ]
}
```

---

## best-horse-racing-tipsters-uk-2026.html (Article)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Best Horse Racing Tipster Services UK 2026",
  "datePublished": "2026-04-16",
  "dateModified": "2026-04-16",
  "author": { "@id": "https://raceoftheday.co.uk/#organization" },
  "publisher": { "@id": "https://raceoftheday.co.uk/#organization" },
  "url": "https://raceoftheday.co.uk/best-horse-racing-tipsters-uk-2026",
  "description": "Comparing verified UK horse racing tipster services in 2026. P&L records, strike rates, price points and independent assessments. No paid placements."
}
```

---

## how-to-choose-verified-horse-racing-tipster.html (HowTo + Article)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      "name": "How to Choose a Verified Horse Racing Tipster",
      "description": "Six steps to evaluate any horse racing tipster service before subscribing.",
      "step": [
        { "@type": "HowToStep", "name": "Check if full selection history is published openly", "position": 1 },
        { "@type": "HowToStep", "name": "Confirm the total number of selections over the stated period", "position": 2 },
        { "@type": "HowToStep", "name": "Verify the average odds of selections", "position": 3 },
        { "@type": "HowToStep", "name": "Confirm bet types and staking method used", "position": 4 },
        { "@type": "HowToStep", "name": "Identify the odds source used (SP, BOG, named bookmaker)", "position": 5 },
        { "@type": "HowToStep", "name": "Confirm trial period includes record access before payment", "position": 6 }
      ]
    },
    {
      "@type": "Article",
      "headline": "How to Choose a Verified Horse Racing Tipster - Complete Guide 2026",
      "datePublished": "2026-04-16",
      "author": { "@id": "https://raceoftheday.co.uk/#organization" },
      "publisher": { "@id": "https://raceoftheday.co.uk/#organization" },
      "url": "https://raceoftheday.co.uk/how-to-choose-a-verified-horse-racing-tipster"
    }
  ]
}
```

---

## each-way-betting-guide-horse-racing.html (HowTo + Article)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      "name": "How to Calculate Each-Way Returns in Horse Racing",
      "description": "How to work out each-way bet returns including win and place parts.",
      "step": [
        { "@type": "HowToStep", "name": "Identify the win odds and place terms for the race", "position": 1 },
        { "@type": "HowToStep", "name": "Calculate the place odds (win odds x place fraction)", "position": 2 },
        { "@type": "HowToStep", "name": "Calculate win return: stake x win odds + stake", "position": 3 },
        { "@type": "HowToStep", "name": "Calculate place return: stake x place odds + stake", "position": 4 },
        { "@type": "HowToStep", "name": "If horse wins: total return = win return + place return", "position": 5 },
        { "@type": "HowToStep", "name": "If horse places only: total return = place return only", "position": 6 }
      ]
    },
    {
      "@type": "Article",
      "headline": "Each-Way Betting Explained - Horse Racing Guide 2026",
      "datePublished": "2026-04-16",
      "author": { "@id": "https://raceoftheday.co.uk/#organization" },
      "publisher": { "@id": "https://raceoftheday.co.uk/#organization" },
      "url": "https://raceoftheday.co.uk/each-way-betting-guide-horse-racing"
    }
  ]
}
```

---

## timeform-alternative.html (Article)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Timeform Alternative 2026 - Jury Daily Closed, What Now?",
  "datePublished": "2026-04-16",
  "author": { "@id": "https://raceoftheday.co.uk/#organization" },
  "publisher": { "@id": "https://raceoftheday.co.uk/#organization" },
  "url": "https://raceoftheday.co.uk/timeform-alternative",
  "description": "Timeform Jury Daily is closed. Race Of The Day fills the gap with selective daily tips and a fully transparent verified record."
}
```

---

## Implementation notes

- Paste each block inside `<script type="application/ld+json">` immediately before `</head>`
- Validate at: https://validator.schema.org/
- Google Rich Results Test: https://search.google.com/test/rich-results
- HowTo schema eligible for rich snippets in Google Search (step-by-step display)
- Article schema enables date display in search results
- SportsEvent schema may trigger event rich snippets for race pages
