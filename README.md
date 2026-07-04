# FieldsApp - Prenotazione Campi Sportivi

Applicazione mobile per la prenotazione e organizzazione di partite nei campi sportivi del territorio.

## Stack Tecnologico

- **Frontend Mobile:** React Native + TypeScript + Expo
- **Backend:** Node.js + TypeScript + Express + Prisma
- **Database:** PostgreSQL
- **Cache & Locking:** Redis
- **Autenticazione:** JWT + bcrypt

## Requisiti

- Node.js >= 20.x
- npm >= 10.x
- Docker + Docker Compose (per PostgreSQL e Redis)

## Installazione

### 1. Clona il repository e installa dipendenze

```bash
# Backend
cd backend
npm install

# Mobile
cd ../mobile
npm install
```

### 2. Configura le variabili d'ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Mobile
cp mobile/.env.example mobile/.env
```

Edita i file `.env` con i tuoi dati (DB_URL, API_URL, etc.)

### 3. Avvia i servizi con Docker

```bash
docker-compose up -d
```

Questo avvia PostgreSQL e Redis.

### 4. Esegui le migrazioni del database

```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Avvia il backend

```bash
cd backend
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`.

### 6. Avvia l'app mobile

```bash
cd mobile
npm start
```

Scansiona il codice QR con Expo Go (Android/iOS) oppure premi `i` per iOS Simulator o `a` per Android Emulator.

## Struttura Progetto

```
fields/
├── backend/                    # Server Node.js + Express
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── app.ts             # Express app
│   │   ├── routes/            # Endpoint routes
│   │   ├── controllers/       # Business logic
│   │   ├── services/          # Services (DB, external APIs)
│   │   ├── utils/             # Helper functions
│   │   └── middleware/        # Auth, validation, error handling
│   ├── prisma/
│   │   └── schema.prisma      # Prisma ORM schema
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .gitignore
├── mobile/                     # React Native + Expo app
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── components/        # Reusable components
│   │   ├── hooks/             # Custom hooks (useAuth, useBookings, etc.)
│   │   ├── services/          # API client, utils
│   │   └── types/             # TypeScript types
│   ├── app.json               # Expo configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .gitignore
├── docker-compose.yml         # PostgreSQL + Redis
└── README.md

```

## Funcionalità Principali

### Per gli Utenti

- **Registrazione e Login** (account obbligatorio per prenotazioni)
- **Prenotazione Campi** (con lock concorrente)
- **Creazione Party** (pubblici o privati)
- **Inviti e Gestione Squadra** (join come guest o account)
- **Sistema di Punti e Badge** (gamification)
- **Notifiche Push** (conferme, promemoria, cambi)
- **Calendario e Cronologia** (prenotazioni passate/future)

### Per l'Admin

- **Dashboard di Gestione** (disponibilità, prezzi, campi)
- **Analytics** (prenotazioni, utenti attivi, revenue)
- **Segnalazioni e Moderazione** (ban, regole)

## API Endpoints (Backend)

### Auth
- `POST /auth/register` - Registrazione
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Fields
- `GET /fields` - Lista campi
- `GET /fields/:id` - Dettagli campo
- `POST /fields` - Crea campo (admin)

### Bookings
- `GET /bookings` - I miei booking
- `POST /bookings` - Crea prenotazione
- `DELETE /bookings/:id` - Cancella prenotazione
- `GET /fields/:id/availability` - Disponibilità oraria

### Parties
- `GET /parties` - Liste party pubblici
- `POST /parties` - Crea party
- `POST /parties/:id/join` - Unisciti a party
- `DELETE /parties/:id/members/:userId` - Rimuovi membro

### Points & Badges
- `GET /users/:id/points` - Punti utente
- `GET /users/:id/badges` - Badge utente
- `GET /leaderboard` - Top 10 giocatori

## Database Schema (Highlights)

- `users` - Utenti registrati (email, phone, password_hash, points)
- `fields` - Campi sportivi (nome, sport, capacità, orari)
- `bookings` - Prenotazioni (field_id, start, end, owner_id, status)
- `parties` - Party (owner_id, field_id, is_public, max_players)
- `party_members` - Membri party (party_id, user_id|guest, display_name)
- `badges` - Badge disponibili (id, name, criteria)
- `user_badges` - Badge assegnati a utenti
- `points_log` - Log transazioni punti (user_id, points, reason)

## Regole Importanti

1. **Prenotazione Obbligatoria:** Solo account registrato può creare booking.
2. **No Overlap:** Constraint DB impedisce prenotazioni sovrapposte stesso campo.
3. **Party & Squadra:** Owner prenotazione + membri party = squadra completa.
4. **Guest in Party:** Ospiti possono unirsi a party con nome/telefono (no account).
5. **Gamification:** Punti per prenotazioni completate, badge per traguardi.
6. **Cancellazione:** Penalty punti se cancellato < 24h prima.

## Sviluppo

### Hot Reload Backend
```bash
cd backend
npm run dev  # usa nodemon per auto-restart
```

### Expo Dev Client
```bash
cd mobile
expo start
# Premi 'i' (iOS), 'a' (Android), 'w' (web)
```

### Test

```bash
cd backend
npm run test

cd ../mobile
npm run test
```

## Deployment

### Backend
- Usa container Docker (`docker build -t fields-api .`)
- Deploy su Heroku, Railway, Render, AWS ECS, etc.
- Variabili d'ambiente salvate nel platform (DATABASE_URL, JWT_SECRET, etc.)

### Mobile
- Expo: `expo build` per APK/IPA
- Oppure gestisci locally con Xcode (iOS) e Android Studio

### Database
- Managed PostgreSQL (AWS RDS, Azure DB, Railway, Neon)
- Run migrations su production: `prisma migrate deploy`

## Troubleshooting

**"Cannot find module 'typescript'"**
```bash
npm install --save-dev typescript
```

**Docker Compose non avvia Postgres**
```bash
docker-compose logs postgres
docker-compose down --volumes  # reset
docker-compose up -d
```

**Prisma schema non sincronizza**
```bash
cd backend
npx prisma migrate dev --name init
```

