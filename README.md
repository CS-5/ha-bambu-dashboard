# Bambu Dashboard

A fast, responsive (phone + desktop) dashboard for monitoring and controlling a
**Bambu Lab printer in LAN-only mode** through Home Assistant, built with
[hakit](https://github.com/shannonhochkins/ha-component-kit), Vite, React and
Tailwind CSS.

It auto-discovers Bambu printers from the
[`ha-bambulab`](https://github.com/greghesp/ha-bambulab) integration — no entity
IDs are hard-coded — and renders a Bambu-inspired dark UI with:

- Live **camera** (HLS via hls.js, MJPEG/poster fallback)
- **Progress ring** — percent, layer x/y, time remaining + ETA, status
- **Temperatures** — nozzle(s) (dual-nozzle aware for the H2D), bed, chamber
- **Fans**, **AMS** filament (colors, types, humidity), **diagnostics** (door, wifi, errors)
- **Controls** — pause / resume / stop, chamber light, speed profile
- **History** charts (temps + progress) over 1h / 6h / 24h
- **Multi-printer** switcher (auto-detected)

## Control gating (hide/lock controls from Home Assistant)

A control or tile renders **only if** its entity is enabled and **not hidden** in
the Home Assistant entity registry. To lock out a sensitive control (e.g. Stop),
just **hide or disable that entity** in HA (Settings → Devices & Services →
Entities → entity → Hide/Disable). The dashboard updates live — no rebuild.

## Develop

```bash
pnpm install
cp .env.example .env      # set VITE_HA_URL (and optionally VITE_HA_TOKEN)
pnpm dev                  # http://localhost:2022
```

On first run you'll log into Home Assistant once (unless `VITE_HA_TOKEN` is set).

```bash
pnpm typecheck            # tsc --noEmit
pnpm build                # production build -> dist/
```

## Deploy (Home Assistant iframe panel)

The dashboard is a static Vite build with relative asset paths (`base: "./"`),
served from Home Assistant's own origin and embedded as a sidebar **iframe panel**.
Because it runs on HA's origin it reuses your existing session automatically — no
token to manage. Inside the panel, hakit inherits HA's authenticated connection
(`window.top.hassConnection`, the parent frame is same-origin); opened outside the
panel it falls back to HA's saved `localStorage` session.

1. **Build:**
   ```bash
   pnpm build
   ```
2. **Copy `dist/` to HA** at `config/www/bambu-dashboard/` (create `www` if it
   doesn't exist), giving `config/www/bambu-dashboard/index.html`. Files under
   `config/www` are served at `/local/…`, so the entry point is
   `/local/bambu-dashboard/index.html`. (Use the Samba/SSH/File-editor add-on, or
   `scp -r dist/* …/config/www/bambu-dashboard/`.)
3. **Add the sidebar panel** in `configuration.yaml`:
   ```yaml
   panel_iframe:
     bambu:
       title: "Printer"
       icon: mdi:printer-3d-nozzle
       url: "/local/bambu-dashboard/index.html"
       require_admin: false
   ```
   Restart Home Assistant (or quick-reload). The panel appears in the sidebar and
   loads using your current session.
4. **Updating:** rebuild and re-copy `dist/` over the same folder, then hard-refresh
   the panel (filenames are content-hashed, so caching is handled).

> Tip: edit `configuration.yaml` in the HA file editor; per HA best practices, avoid
> touching UI-managed `.storage/` files directly.

## Optional: typed entity IDs

This project resolves entities dynamically, so typed entity names aren't required.
If you want hakit's autocompletion for HA entities/services, run its type sync:

```bash
pnpm dlx @hakit/core hakit-sync-types --url $VITE_HA_URL --token <long-lived-token>
```
