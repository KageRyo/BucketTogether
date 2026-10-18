-- Reference entrypoint for psql on an empty development database.
-- Production: apply versioned migrations with `npm run db:migrate`.
\ir migrations/202610180001_public_beta.sql
