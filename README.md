# Bestel-app (basis)

Offline-first bestel-app voor Zoho Inventory, gebouwd met Next.js, React en Dexie.js.
De data komt uit Zoho Inventory (regio UK) via eigen route handlers in `app/api/`.

## Starten

```bash
npm install
npm run dev
```

Vul eerst `.env.local` in (wordt niet gecommit):

```
REFRESH_TOKEN_ZOHO_INVENTORY=   # Self Client, scope ZohoInventory.FullAccess.all
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_ORGANIZATION_ID=           # Zoho Inventory → Settings → Organization Profile
```

Na een wijziging in `.env.local` de dev-server herstarten.

Open daarna http://localhost:3000

## Wat werkt er al?

1. **Synchroniseren** (startscherm): producten en winkels (de klanten van de importeur)
   worden uit Zoho opgehaald en in de lokale database gezet. Daarna werkt het bestellen
   ook offline. Mislukt een sync, dan blijft de vorige data staan.
2. **Stores**: per winkel sleep je de productgroepen (Dranken, Diepvries, ...) in de
   volgorde waarin je die winkel doorloopt. Die volgorde blijft bewaard bij een nieuwe sync.
3. **Nieuwe bestelling**: eerst een winkel kiezen — pas dan verschijnen de producten,
   in de volgorde die voor die winkel is ingesteld. Varianten (smaken) staan bij elkaar.
4. **Bestellingen**: overzicht met status (wacht op verzending / in Zoho / mislukt).
   Versturen maakt een sales order in Zoho aan, met het bestel-ID als `reference_number`
   (bestaat die al, dan wordt er geen dubbele aangemaakt).
5. **Online/offline-indicator** rechtsboven. Wachtende bestellingen worden automatisch
   verstuurd: als de verbinding terugkomt, als je terug naar het tabblad gaat en elke 30 seconden.
   Is Zoho onbereikbaar, dan blijft de bestelling gewoon wachten. Alleen bestellingen die Zoho
   echt weigert worden "mislukt"; die verstuur je opnieuw met **Send now**.

## Offline testen

1. Open DevTools (F12) → tab **Network** → zet **No throttling** op **Offline**.
2. Maak een bestelling: ze blijft op "Wacht op verzending" staan.
3. Zet terug op **No throttling**: de bestelling wordt automatisch verstuurd.

Let op: de pagina **herladen** terwijl je offline bent werkt nog niet.
Daarvoor is een service worker nodig (fase 5, met Serwist).

Je lokale database bekijken: DevTools → **Application** → **IndexedDB** → `ZohoBestelApp`.

## Structuur

```
app/
  api/items/route.ts     Zoho items → Item (alleen actieve)
  api/stores/route.ts    Zoho klanten → winkels
  api/orders/route.ts    Bestelling → Zoho sales order
  page.tsx               Startscherm + synchroniseren
  order/page.tsx         Bestelscherm (eerst winkel kiezen)
  orders/page.tsx        Overzicht bestellingen
  stores/page.tsx        Winkel-layouts (drag-and-drop volgorde productgroepen)
components/
  StatusBar.tsx          Navigatie, online/offline, automatisch versturen
lib/
  types.ts               Types in Zoho-vorm (Item, Store, Order) — Store = de winkel/klant
  api.ts                 Databron-laag: roept /api/items, /api/stores en /api/orders aan
  zoho.ts                Server-only: Zoho access token + API-aanroepen
  db.ts                  Lokale database (Dexie / IndexedDB)
  sync.ts                Ophalen van data + versturen van wachtende bestellingen
```

## Volgende stappen

- **Fase 5**: Serwist toevoegen zodat de app ook offline opent.
- **Later**: schatting van de bestelling op basis van historie.
