# AIMSOMNIA Portfolio with Juno Analytics

This is a static portfolio website for AIMSOMNIA, showcasing digital art collections and projects. It's now integrated with Juno Analytics for privacy-focused analytics tracking.

## Juno Analytics Integration

This portfolio now includes Juno Analytics, a privacy-focused analytics solution that respects user privacy without using cookies.

### Implementation Details

The analytics are implemented using the CDN version of the Juno Analytics library:

```html
<script type="module">
  import { initOrbiter } from "https://cdn.jsdelivr.net/npm/@junobuild/analytics@0.2.0/+esm";

  document.addEventListener(
    "DOMContentLoaded",
    () =>
      initOrbiter({
        satelliteId: "njql7-pqaaa-aaaal-asagq-cai", // Satellite ID from juno.config.json
        orbiterId: "p2pi7-hiaaa-aaaal-asaia-cai" // Orbiter ID from juno.config.json
      }),
    {
      once: true
    }
  );
</script>
```

### Configuration

The integration uses the IDs from `juno.config.json`:
- Satellite ID: `njql7-pqaaa-aaaal-asagq-cai`
- Orbiter ID: `p2pi7-hiaaa-aaaal-asaia-cai`

### Features

1. **No Cookie Banners Needed**: Privacy-focused analytics without cookies
2. **Tiny Footprint**: Under 3KB gzipped
3. **Page View Tracking**: Automatically tracks page views
4. **Custom Event Tracking**: Tracks user interactions with collections and projects
5. **Web Vitals**: Automatically collects performance metrics
6. **Campaign Tracking**: Supports UTM parameters for marketing attribution

### Build Process

The standard build process includes the analytics implementation:

```bash
npm run build
```

This command creates a `build` directory and copies all necessary files, including the updated `index.html` with the analytics script.

### Custom Event Tracking

The implementation includes custom event tracking for user interactions:

1. **Collection Views**: When a user clicks "Check It!" on a collection item, a `collection_view` event is tracked with the collection name and URL as metadata
2. **Project Views**: When a user clicks "Visit Project" on the Vibe-Project, a `project_view` event is tracked with the project name and URL as metadata

All tracked events are sent to Juno Analytics silently without any console logging to avoid showing tracking information to end users. The implementation includes validation to ensure only events with proper metadata are tracked.

### Testing

To test locally:
1. Run `python3 -m http.server 8000`
2. Visit `http://localhost:8000` in your browser
3. Click on collection or project links to trigger custom events
4. Verify events are being tracked through the Juno Analytics dashboard

Note: All console logging has been removed to avoid showing tracking information to end users.