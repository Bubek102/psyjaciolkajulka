# psyjaciolkajulka.pl

Strona PSYjaciółki Julki (Julia Przewoźna, trenerka i behawiorystka psów). To statyczna strona bez kroku budowania: HTML, CSS i JS.

## Uruchomienie lokalne

```bash
npx serve .          # albo: python3 -m http.server
```

## Publikacja na Vercel (zalecane)

1. Wejdź na vercel.com → **Add New… → Project** → zaimportuj repozytorium `Bubek102/psyjaciolkajulka`.
2. **Framework Preset:** `Other`. Pola Build Command i Output Directory zostaw puste.
3. Kliknij **Deploy**. Vercel nada adres w stylu `*.vercel.app`.
4. Domena: **Settings → Domains** → dodaj `psyjaciolkajulka.pl` (i `www.psyjaciolkajulka.pl`). Potem ustaw u rejestratora domeny rekordy DNS, które pokaże Vercel.

Od tej chwili każdy push do repozytorium automatycznie aktualizuje stronę. Gałęzie inne niż produkcyjna dostają własny adres podglądu. Plik `vercel.json` ustawia cache dla fontów i obrazków oraz podstawowe nagłówki bezpieczeństwa.

Stronę można też wrzucić na inny hosting statyczny, np. Netlify, Cloudflare Pages, GitHub Pages albo zwykły FTP.

## Co warto uzupełnić

| Co | Gdzie |
|---|---|
| Zdjęcie Julki (pionowe, ok. 720×900) | `assets/img/julka.jpg` |
| 6 zdjęć z Instagrama (kwadratowe) | `assets/instagram/1.jpg` … `6.jpg` |
| Linki do konkretnych typów spotkań w Cal.com | `config.js` → `services[].calLink` |

Dopóki brakuje któregoś zdjęcia, strona pokazuje ilustrowaną zaślepkę, więc nic się nie „sypie”.

## Przed publikacją

- **Polityka prywatności** (`polityka-prywatnosci.html`) to wzór. Uzupełnij dane działalności (adres, ewentualnie NIP) i sprawdź treść z księgową albo prawnikiem.
- **Strona 404** (`404.html`) działa automatycznie na Netlify, Vercel, Cloudflare Pages i GitHub Pages.

## Jakość

- Fonty (Fraunces, Manrope) są hostowane lokalnie w `assets/fonts/`, więc strona nie łączy się z Google Fonts. To szybciej i bezpieczniej pod kątem RODO.
- Kolory spełniają wymagania kontrastu WCAG AA. Audyt axe-core nie zgłasza żadnych błędów.
- Zastosowana jest polska typografia: jednoliterowe spójniki i myślniki nie zostają na końcu linii, a kwoty nie rozdzielają się od „zł”. Przy dopisywaniu tekstu wstawiaj `&nbsp;` po „w”, „i”, „z”, „o”, „a”, „u”.
- Strona ma dane strukturalne dla Google (usługa z cennikiem i FAQ), Open Graph, manifest oraz ikony dla telefonów.

## Rezerwacje

Wszystkie przyciski „Umów” prowadzą bezpośrednio do kalendarza Julki w Cal.com (`cal.com/psyjaciolka-julka`). Tam klient wybiera termin i potwierdza rezerwację. Linki działają także bez JavaScriptu.

Żeby przycisk przy danej usłudze otwierał od razu kalendarz tej usługi, uzupełnij `calLink` w `config.js` (np. `psyjaciolka-julka/konsultacja-online`). Integracja kalendarza bezpośrednio na stronie jest planowana na później.

## Źródła treści

Treści pochodzą z publicznych profili Julki: TikTok @psyjaciolka.julka, Facebook, profil Cal.com. Wykorzystane są opis działalności, cennik, tematy porad i dane kontaktowe.
