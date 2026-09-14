# Teller — Sip & Saf

Een mobiel-vriendelijke webapp om de tel bij te houden van **Sip**, **Saf** en
al wat je er zelf bij maakt. Geen account, geen server: alles blijft lokaal in
je browser (`localStorage`) en de app werkt offline.

## Wat kan het

- **Meerdere tellers** — Sip en Saf staan er standaard in.
- **+ knop** rechtsonder om er een teller bij te maken (naam, stapgrootte, kleur).
- **Grote plus/min knoppen** per teller, gemaakt voor duimen.
- **Reset, bewerken of verwijderen** per teller — met "Ongedaan" als je mistikt.
- **Alles op nul** en **import/export (JSON)** via het menu rechtsboven.
- **Installeerbaar** als app op je telefoon (PWA) en volledig offline bruikbaar.

## Gebruiken

Open `index.html` in je browser, of serveer de map lokaal (nodig voor de
offline-modus en installeren op je telefoon):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Op je gsm: open het adres en kies *Toevoegen aan beginscherm*.

## Online zetten met GitHub Pages

De app is een statische site en staat klaar voor GitHub Pages — alle paden zijn
relatief, dus hij werkt ook onder een submap zoals `https://<gebruiker>.github.io/teller/`.

1. Merge deze branch naar `main`.
2. Ga naar **Settings → Pages** en zet *Source* op **GitHub Actions**.
3. De workflow in `.github/workflows/pages.yml` publiceert bij elke push naar
   `main` (of handmatig via *Run workflow*).

Liever zonder Actions? Kies bij *Source* gewoon **Deploy from a branch** — de
repo-root bevat al een `.nojekyll`, zodat GitHub de bestanden ongemoeid laat.

### Updates

De service worker haalt navigatie via het netwerk op en ververst de overige
bestanden op de achtergrond, zodat een nieuwe deploy niet achter de cache van
GitHub Pages blijft hangen. Staat de app open terwijl je publiceert, dan
verschijnt er een **"Nieuwe versie beschikbaar — Herladen"** melding. Bump bij
een deploy de `CACHE`-constante in `sw.js` als je die melding wil forceren.

## Onder de motorkap

Geen build-stap, geen dependencies — enkel `index.html`, `styles.css`, `app.js`,
een manifest en een service worker.

| Bestand | Rol |
| --- | --- |
| `index.html` | Structuur en dialogen |
| `styles.css` | Styling, mobile-first met safe-area support |
| `app.js` | Tellerlogica en opslag in `localStorage` (sleutel `teller.sipsaf.v1`) |
| `sw.js` | Service worker: network-first voor de pagina, stale-while-revalidate voor assets |
| `.github/workflows/pages.yml` | Publiceert de site naar GitHub Pages |
| `manifest.webmanifest`, `icons/` | Installeerbaar als PWA |
