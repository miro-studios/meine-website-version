miro-studios — Logo Pack (Set-Square)
=======================================

Konzept "Set-Square": M als Zeichendreieck mit orangem Werkstattstrich.

DATEIEN
-------

SVG (skalierbar, ideal fürs Web & Print)
  mark-dark.svg              Mark allein, dunkles BG (Avatar-tauglich)
  mark-paper.svg             Mark allein, Cream-BG
  mark-monochrome.svg        Mark einfarbig (currentColor — nimmt Textfarbe)
  favicon.svg                Favicon mit rundem Hintergrund (für <link rel="icon">)
  wordmark-dark.svg          Voll-Lockup auf Schwarz
  wordmark-paper.svg         Voll-Lockup auf Cream
  wordmark-transparent-*.svg Lockup ohne Hintergrund

PNG (raster, für Plattformen die kein SVG akzeptieren)
  png/avatar-dark-1080.png    Instagram Profilbild · dunkel
  png/avatar-paper-1080.png   Instagram Profilbild · cream
  png/avatar-accent-1080.png  Instagram Profilbild · orange
  png/favicon-32.png          16-Tab-Favicon Fallback
  png/favicon-192.png         Android-Touch-Icon
  png/favicon-512.png         iOS-Touch-Icon / PWA
  png/wordmark-dark-1600.png   Header-Lockup · dunkel
  png/wordmark-paper-1600.png  Header-Lockup · cream
  png/og-share-1200x630.png    Open Graph (Facebook/LinkedIn/WhatsApp share)
  png/banner-1500x500.png      Twitter / X Banner
  png/banner-1584x396.png      LinkedIn Cover
  png/mark-cream-1024.png      Mark allein · transparenter BG · cream
  png/mark-ink-1024.png        Mark allein · transparenter BG · ink

WO HOCHLADEN
------------

Instagram
  Profil-Avatar     → avatar-dark-1080.png  (am stärksten als Bubble)
  Story-Highlight   → mark-cream-1024.png
  Post-Vorlage      → 1080×1080, Mark in einer Ecke

Google Search
  Favicon im Tab    → favicon.svg + favicon-32.png als Fallback
                      (im <head> einbinden — Code unten)
  Rich Result Logo  → favicon-512.png (256×256+ ist Pflicht für Google
                      Search Logos via schema.org Organization)
  Site-Share        → og-share-1200x630.png als og:image

Im HTML <head> einbinden:

  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
  <link rel="apple-touch-icon" sizes="192x192" href="/favicon-192.png">
  <meta property="og:image" content="https://miro-studios.de/og-share.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

FARBEN
------
  Background     #0E0E0C
  Text / Mark    #F0EDE4
  Accent (dark)  #FF4D1C
  Accent (paper) #C75D2F
  Paper          #F5F2EA
  Ink            #16140F

TYPOGRAFIE
----------
  Display:  Fraunces (Google Fonts)
  Mono:     JetBrains Mono (Google Fonts)
