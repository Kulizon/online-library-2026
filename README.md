# Projekt nr 4 - Księgarnia online

## 1. Opis tematu

Celem projektu jest zaprojektowanie i implementacja aplikacji internetowej obsługującej księgarnię online, w której użytkownicy mogą przeglądać katalog książek oraz wypożyczać je online, a następnie odebrać fizyczny egzemplarz w księgarni następnego dnia.

System wspiera podstawowe procesy biznesowe księgarni:
- zarządzanie ofertą książek,
- obsługę wypożyczeń realizowanych przez Internet,
- kontrolę dostępności książek,
- zarządzanie użytkownikami oraz ich rolami.

Aplikacja rozróżnia dwa typy użytkowników:
- klient księgarni - przegląda katalog i wypożycza książki,
- bibliotekarz (administrator) - zarządza książkami i wypożyczeniami.

System ma charakter aplikacji webowej typu client–server, z frontendem realizowanym w technologii React oraz backendem opracowanym w architekturze mikroserwisowej.

Aplikacja nie udostępnia treści książek w formie cyfrowej - wypożyczenie polega na rezerwacji książki online i jej fizycznym odbiorze w księgarni.

### 1.1. Potrzeby biznesowe
Projekt odpowiada na kluczowe potrzeby operacyjne księgarni i biblioteki:
- digitalizacja procesu rezerwacji książek i ograniczenie obsługi telefonicznej / manualnej,
- zwiększenie rotacji dostępnych egzemplarzy poprzez lepszą kontrolę statusów wypożyczeń,
- zmniejszenie liczby błędów związanych z dostępnością (np. podwójna rezerwacja tego samego egzemplarza),
- usprawnienie pracy personelu dzięki centralnej liście rezerwacji, odbiorów i zwrotów,
- budowanie lojalności klientów poprzez wygodny kanał online i szybszą obsługę na miejscu.

### 1.2. Korzyści dla użytkowników
Najważniejsze korzyści z punktu widzenia użytkowników systemu:

**Dla klienta księgarni:**
- wygodne wyszukiwanie i rezerwowanie książek bez wizyty w placówce,
- szybka informacja o dostępności i przewidywanym terminie odbioru,
- podgląd własnych wypożyczeń i statusów rezerwacji w jednym miejscu,
- krótszy czas obsługi przy odbiorze książki w księgarni.

**Dla bibliotekarza / administratora:**
- łatwiejsze zarządzanie katalogiem i stanami magazynowymi,
- bieżąca kontrola nad kolejką rezerwacji, odbiorów i zwrotów,
- mniejsze ryzyko pomyłek operacyjnych dzięki uporządkowanemu procesowi,
- możliwość szybszego reagowania na braki i zapotrzebowanie klientów.

## 2. Funkcjonalności systemu

### 2.1. Funkcjonalności klienta księgarni
- rejestracja i logowanie do systemu – *niezbędne, by móc przypisać rezerwowane książki do konkretnej osoby oraz zabezpieczyć jej konto.*
- przeglądanie katalogu książek – *podstawowa funkcja pozwalająca klientom na zapoznanie się z asortymentem i ofertą księgarni.*
- wyszukiwanie książek (np. po tytule lub autorze) – *umożliwia szybkie znalezienie konkretnej pozycji w dużym zbiorze książek, znacząco poprawiając czas obsługi.*
- sprawdzanie dostępności książek – *pozwala uniknąć prób rezerwacji książek, których fizycznie zabrakło we współdzielonym magazynie.*
- wypożyczanie książek online (rezerwacja) – *kluczowy proces biznesowy, pozwalający klientowi zablokować i zagwarantować sobie dany egzemplarz przed fizyczną wizytą w sklepie.*
- podgląd listy aktualnych wypożyczeń klienta – *daje użytkownikowi samodzielną kontrolę nad swoimi rezerwacjami (bieżącymi i historycznymi).*
- informacja o dacie odbioru książki (następny dzień roboczy) – *formuje poprawne oczekiwania klienta odnośnie czasu, w którym zamówienie będzie wyciągnięte z magazynu i przygotowane do odbioru.*

### 2.2. Funkcjonalności bibliotekarza (administratora)
- dodawanie nowych książek do oferty – *pozwala na wprowadzanie nowości wydawniczych do cyfrowego asortymentu księgarni.*
- edycja danych książek (tytuł, autor, opis) – *umożliwia poprawę ewentualnych błędów we wpisach katalogowych oraz aktualizację opisów.*
- usuwanie książek z katalogu – *potrzebne w sytuacji całkowitego i trwałego wycofania danej pozycji z fizycznej dystrybucji.*
- zarządzanie dostępnością (liczbą fizycznych egzemplarzy) książek – *konieczne do synchronizacji cyfrowych stanów magazynowych z faktyczną inwentaryzacją.*
- przegląd wszystkich wypożyczeń w systemie – *umożliwia pracownikom kontrolę nad listą książek, które należy fizycznie skompletować i odłożyć na półkę rezerwacji każdego dnia.*
- oznaczanie książek jako wydanych (odebranych przez klienta) oraz zwróconych – *operacja domykająca proces; synchronizuje zamknięcie rezerwacji po faktycznym odbiorze/zwrocie egzemplarza przez klienta w sklepie.*

### 2.3. Wymagania niefunkcjonalne i techniczne
- autentykacja i autoryzacja użytkowników oparta o JSON Web Token (JWT),
- obsługa ról użytkowników (klient, bibliotekarz),
- asynchroniczna komunikacja klient–serwer poprzez REST API,
- relacyjna baza danych.

## 3. Projektowanie architektury aplikacji

#### 3.1. Serwis autentykacji użytkowników (AuthService)
Odpowiedzialność:
- logowanie i rejestracja użytkowników,
- generowanie i weryfikacja tokenów JWT dla innych serwisów,
- zarządzanie danymi i rolami użytkowników (klient, bibliotekarz).

#### 3.2. Serwis zarządzania książkami (BookService)
Odpowiedzialność:
- przechowywanie informacji o książkach (tytuły, autorzy, opisy, ISBN),
- obsługa przeglądania i wyszukiwania katalogu,
- utrzymanie kontroli nad łączną liczbą dostępnych oraz wypożyczonych egzemplarzy (Inventory). 

#### 3.3. Serwis wypożyczeń (RentalService)
Odpowiedzialność:
- proces zakładania nowych rezerwacji / wypożyczeń online przez klienta,
- walidacja wypożyczeń we współpracy z BookService (czy książka fizycznie jest na stanie),
- aktualizacja statusu odbioru i zwrotu książek z punktu widzenia fizycznej księgarni.

### 3.4. Frontend (React SPA)
Odpowiedzialność:
- renderowanie widoków po stronie klienta (CSR),
- komunikacja z serwisami backendowymi poprzez REST API (fetch / axios),
- zarządzanie stanem sesji użytkownika (przechowywanie JWT w pamięci / localStorage).

### 3.5. Schemat komunikacji

```
┌──────────────┐        ┌─────────────────┐
│   React SPA  │──JWT──▶│  AuthService    │  :3001
│  (Frontend)  │        │  /api/auth/*    │
│   :5173      │        └─────────────────┘
│              │        ┌─────────────────┐
│              │──JWT──▶│  BookService    │  :3002
│              │        │  /api/books/*   │
│              │        └─────────────────┘
│              │        ┌─────────────────┐
│              │──JWT──▶│  RentalService  │  :3003
│              │        │  /api/rentals/* │
└──────────────┘        └─────────────────┘
```

Każdy serwis backendowy posiada własną bazę danych SQLite (zarządzaną przez Sequelize). Serwisy komunikują się z frontendem wyłącznie przez REST API. RentalService w razie potrzeby odpytuje BookService wewnętrznie (server-to-server) w celu walidacji dostępności egzemplarzy.

---

## 4. Projektowanie struktury bazy danych

### 4.1. Baza danych AuthService (`auth.sqlite`)

#### Tabela `Users`
| Kolumna      | Typ          | Opis                                      |
|--------------|--------------|-------------------------------------------|
| id           | INTEGER (PK) | Klucz główny, auto-increment              |
| email        | STRING       | Adres e-mail (unikalny)                   |
| password     | STRING       | Hash hasła (bcrypt)                       |
| firstName    | STRING       | Imię użytkownika                          |
| lastName     | STRING       | Nazwisko użytkownika                      |
| role         | ENUM         | `'client'` / `'librarian'`                |
| createdAt    | DATE         | Data utworzenia konta                      |
| updatedAt    | DATE         | Data ostatniej modyfikacji                |

### 4.2. Baza danych BookService (`books.sqlite`)

#### Tabela `Books`
| Kolumna        | Typ          | Opis                                    |
|----------------|--------------|-----------------------------------------|
| id             | INTEGER (PK) | Klucz główny, auto-increment            |
| title          | STRING       | Tytuł książki                           |
| author         | STRING       | Autor / autorzy                         |
| isbn           | STRING       | Numer ISBN-10 lub ISBN-13, np. `832401234X` albo `978-83-8196-545-3` (unikalny) |
| ean            | STRING       | Kod EAN, 13 cyfr bez myślników (unikalny, opcjonalny) |
| description    | TEXT         | Opis / streszczenie książki             |
| totalCopies    | INTEGER      | Łączna liczba egzemplarzy w magazynie   |
| availableCopies| INTEGER      | Liczba egzemplarzy aktualnie dostępnych |
| createdAt      | DATE         | Data dodania do katalogu                |
| updatedAt      | DATE         | Data ostatniej modyfikacji              |

### 4.3. Baza danych RentalService (`rentals.sqlite`)

#### Tabela `Rentals`
| Kolumna      | Typ          | Opis                                           |
|--------------|--------------|------------------------------------------------|
| id           | INTEGER (PK) | Klucz główny, auto-increment                   |
| userId       | INTEGER      | ID użytkownika (z AuthService)                 |
| bookId       | INTEGER      | ID książki (z BookService)                     |
| status       | ENUM         | `'reserved'` / `'picked_up'` / `'returned'`   |
| pickupDate   | DATE         | Planowana data odbioru (następny dzień roboczy)|
| returnedAt   | DATE         | Data faktycznego zwrotu (nullable)             |
| createdAt    | DATE         | Data złożenia rezerwacji                       |
| updatedAt    | DATE         | Data ostatniej zmiany statusu                  |

---

## 5. Specyfikacja REST API

### 5.1. AuthService (`/api/auth`)

| Metoda | Endpoint             | Opis                          | Autoryzacja |
|--------|----------------------|-------------------------------|-------------|
| POST   | `/api/auth/register` | Rejestracja nowego użytkownika| brak        |
| POST   | `/api/auth/login`    | Logowanie, zwraca JWT         | brak        |
| GET    | `/api/auth/me`       | Pobranie profilu zalogowanego | JWT         |

#### POST `/api/auth/register`
- Body: `{ "email", "password", "firstName", "lastName" }`
- Odpowiedź `201`: `{ "id", "email", "role" }`

#### POST `/api/auth/login`
- Body: `{ "email", "password" }`
- Odpowiedź `200`: `{ "token": "<JWT>" }`

#### GET `/api/auth/me`
- Header: `Authorization: Bearer <token>`
- Odpowiedź `200`: `{ "id", "email", "firstName", "lastName", "role" }`

### 5.2. BookService (`/api/books`)

| Metoda | Endpoint           | Opis                              | Autoryzacja      |
|--------|--------------------|-----------------------------------|------------------|
| GET    | `/api/books`       | Lista książek (z paginacją/search)| brak / JWT       |
| GET    | `/api/books/:id`   | Szczegóły pojedynczej książki     | brak / JWT       |
| POST   | `/api/books`       | Dodanie nowej książki             | JWT (librarian)  |
| PUT    | `/api/books/:id`   | Edycja danych książki             | JWT (librarian)  |
| DELETE | `/api/books/:id`   | Usunięcie książki z katalogu      | JWT (librarian)  |
| PATCH  | `/api/books/:id/stock` | Zmiana liczby egzemplarzy     | JWT (librarian)  |

#### GET `/api/books?search=&page=&limit=`
- Odpowiedź `200`: `{ "books": [...], "total", "page", "totalPages" }`
- `search` szuka po tytule, autorze, ISBN oraz EAN.

#### POST `/api/books`
- Body: `{ "title", "author", "isbn", "ean", "description", "totalCopies" }`
- `isbn`: ISBN-10 lub ISBN-13, np. `832401234X` albo `978-83-8196-545-3`
- `ean`: 13 cyfr bez myślników, np. `9788381965453`
- Można podać samo `ean`; dla kodów zaczynających się od `978`/`979` serwis uzupełni ISBN-13 automatycznie.
- Odpowiedź `201`: `{ "id", "title", ... }`

### 5.3. RentalService (`/api/rentals`)

| Metoda | Endpoint                  | Opis                                     | Autoryzacja      |
|--------|---------------------------|------------------------------------------|------------------|
| POST   | `/api/rentals`            | Złożenie rezerwacji (wypożyczenie online) | JWT (client)     |
| GET    | `/api/rentals`            | Lista wypożyczeń zalogowanego użytkownika| JWT (client)     |
| GET    | `/api/rentals/all`        | Lista wszystkich wypożyczeń w systemie   | JWT (librarian)  |
| PATCH  | `/api/rentals/:id/pickup` | Oznaczenie jako odebrane                 | JWT (librarian)  |
| PATCH  | `/api/rentals/:id/return` | Oznaczenie jako zwrócone                 | JWT (librarian)  |

#### POST `/api/rentals`
- Body: `{ "bookId" }`
- Logika: sprawdzenie dostępności (zapytanie do BookService), zmniejszenie `availableCopies`, ustawienie `pickupDate` na następny dzień roboczy.
- Odpowiedź `201`: `{ "id", "bookId", "status": "reserved", "pickupDate" }`

#### PATCH `/api/rentals/:id/return`
- Logika: zmiana statusu na `returned`, zwiększenie `availableCopies` w BookService.
- Odpowiedź `200`: `{ "id", "status": "returned", "returnedAt" }`

---

## 6. Stos technologiczny

| Warstwa    | Technologia                        |
|------------|------------------------------------|
| Frontend   | React (Vite), React Router, Axios  |
| Backend    | Node.js LTS, Express, cors, jsonwebtoken, bcrypt |
| ORM        | Sequelize                          |
| Baza danych| SQLite3 (osobna baza per serwis)   |
| Autoryzacja| JWT (JSON Web Token)               |
| Konfiguracja| zmienne środowiskowe (pliki `.env` + dotenv) |

---

## 7. Uruchomienie projektu

```bash
# 1. Instalacja zależności
make install

# 2. Skopiowanie plików konfiguracyjnych
cp services/auth/.env.example services/auth/.env
cp services/books/.env.example services/books/.env
cp frontend/.env.example frontend/.env

# 3. Uruchomienie wszystkiego naraz
make dev

# Lub osobno:
make auth      # AuthService na :3001
make books     # BookService na :3002
make frontend  # React SPA na :5173
```

### 7.1. Konta bibliotekarza i administratora

Zwykla rejestracja przez `POST /api/auth/register` zawsze tworzy konto klienta.

Pierwsze konto administratora moze zostac utworzone automatycznie przy starcie `AuthService` na podstawie zmiennych w `services/auth/.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Admin
```

Po zalogowaniu admin moze tworzyc konta pracownicze przez:

```http
POST /api/auth/staff
Authorization: Bearer <token-admina>
Content-Type: application/json

{
  "email": "bibliotekarz@example.com",
  "password": "haslo123",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "role": "librarian"
}
```

Pole `role` przyjmuje wartosc `librarian` albo `admin`.

---

## 8. Struktura repozytorium

```
online-library-2026/
├── frontend/              # React SPA (Vite)
│   ├── src/
│   │   ├── context/       # AuthContext (stan sesji)
│   │   ├── pages/         # Login, Register, Home
│   │   ├── api.js         # Axios instance
│   │   └── App.jsx        # Routing
│   └── .env.example
├── services/
│   ├── auth/              # AuthService (Express + Sequelize)
│       ├── models/        # User model
│       ├── routes/        # /api/auth/*
│       ├── middleware/    # JWT verification
│       └── .env.example
│   └── books/             # BookService (Express + Sequelize)
│       ├── models/        # Book model
│       ├── routes/        # /api/books/*
│       ├── middleware/    # JWT verification and role checks
│       └── .env.example
├── Makefile
├── .gitignore
└── README.md
```
