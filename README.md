# Bestel-app (basis)

Offline-first bestel-app voor Zoho Inventory, gebouwd met Next.js, React en Dexie.js.
Deze versie werkt nog met **nepdata** (mock data); de koppeling met Zoho volgt later.

## Starten

```bash
npm install
npm run dev
```

Open daarna http://localhost:3000

## Wat werkt er al?

1. **Synchroniseren** (startscherm): producten en winkels (de klanten van de importeur)
   worden in de lokale database gezet.
2. **Stores**: per winkel sleep je de productgroepen (Dranken, Diepvries, ...) in de
   volgorde waarin je die winkel doorloopt. Die volgorde blijft bewaard bij een nieuwe sync.
3. **Nieuwe bestelling**: eerst een winkel kiezen — pas dan verschijnen de producten,
   in de volgorde die voor die winkel is ingesteld. Varianten (smaken) staan bij elkaar.
4. **Bestellingen**: overzicht met status (wacht op verzending / in Zoho / mislukt).
   Het versturen is nog nep: de sales order verschijnt in de browserconsole (F12).
5. **Online/offline-indicator** rechtsboven. Komt de verbinding terug, dan worden
   wachtende bestellingen automatisch verstuurd.

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
  page.tsx               Startscherm + synchroniseren
  order/page.tsx         Bestelscherm (eerst winkel kiezen)
  orders/page.tsx        Overzicht bestellingen
  stores/page.tsx        Winkel-layouts (drag-and-drop volgorde productgroepen)
components/
  StatusBar.tsx          Navigatie, online/offline, automatisch versturen
lib/
  types.ts               Types in Zoho-vorm (Item, Store, Order) — Store = de winkel/klant
  mock-data.ts           Nepdata (verdwijnt later)
  api.ts                 Databron-laag: hier komt later de Zoho-koppeling
  db.ts                  Lokale database (Dexie / IndexedDB)
  sync.ts                Ophalen van data + versturen van wachtende bestellingen
```

## Volgende stappen

- **Zoho koppelen**: route handlers maken in `app/api/` en in `lib/api.ts` de mock vervangen door `fetch()`.
- **Fase 5**: Serwist toevoegen zodat de app ook offline opent.
- **Later**: schatting van de bestelling op basis van historie.
