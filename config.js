/*
 * Konfiguracja strony psyjaciolkajulka.pl
 *
 * Przyciski rezerwacji prowadzą do kalendarza Cal.com Julki: https://cal.com/psyjaciolka-julka
 * Aby kliknięcie usługi otwierało od razu jej kalendarz (a nie listę wszystkich usług),
 * wpisz w `calLink` pełny link do konkretnego wydarzenia, np. "psyjaciolka-julka/konsultacja-online"
 * (to, co jest po "cal.com/" w adresie danego typu spotkania w panelu Cal.com).
 */
window.SITE_CONFIG = {
  // Zdjęcia: wrzuć pliki i zmień na true
  //   julka     -> assets/img/julka.jpg (zdjęcie w sekcji „O mnie”)
  //   instagram -> assets/instagram/1.jpg … 6.jpg (siatka pod kartą profilu)
  photos: { julka: false, instagram: false },

  calOrigin: "https://cal.com",
  calProfile: "psyjaciolka-julka",
  brandColor: "#2f5d50",
  email: "psyjaciolkajulka@gmail.com",

  services: [
    {
      id: "pierwsza",
      name: "Pierwsza konsultacja behawioralna",
      price: "250 zł",
      meta: "+ dojazd · w domu psa",
      calLink: "psyjaciolka-julka"
    },
    {
      id: "kolejna",
      name: "Kolejna konsultacja",
      price: "200 zł",
      meta: "kontynuacja pracy",
      calLink: "psyjaciolka-julka"
    },
    {
      id: "online",
      name: "Konsultacja online",
      price: "200 zł",
      meta: "wideorozmowa",
      calLink: "psyjaciolka-julka"
    },
    {
      id: "telefon",
      name: "Szybka konsultacja telefoniczna",
      price: "80 zł",
      meta: "25 minut",
      calLink: "psyjaciolka-julka"
    }
  ]
};
