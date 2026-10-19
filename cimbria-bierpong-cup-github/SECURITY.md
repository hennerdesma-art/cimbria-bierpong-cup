# Security status

This repository currently contains a **local prototype**, not a production service.

- Registration and results are stored only in each browser's localStorage.
- Admin controls have no authentication and are not suitable for public deployment.
- Do not enable public registration or present tournament results as synchronized until a backend, authentication and authorization have been deployed.
- Do not commit credentials or private keys. Use environment variables and backend secrets for production.
- Before public launch, add server-side validation, Supabase RLS, anti-spam protection, and basic data protection notices.
