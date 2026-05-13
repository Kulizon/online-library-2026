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
