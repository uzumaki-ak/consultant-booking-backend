# consultant-booking-backend

## Render

Use a Node web service.

Build command:

```bash
npm run render-build
```

Start command:

```bash
npm start
```

Health check path:

```text
/health
```

`render-build` installs dev dependencies because the TypeScript build needs type packages
such as `@types/express`, even when the service environment is `NODE_ENV=production`.
