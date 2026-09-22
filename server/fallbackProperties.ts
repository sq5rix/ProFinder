import { Property } from '../src/types';

export function getFallbackProperties(query: string, dealType: string, count: number = 8): Property[] {
  const lowerQuery = query.toLowerCase();
  
  const isRent = dealType === 'Wynajem' || lowerQuery.includes('wynaj') || lowerQuery.includes('najem') || lowerQuery.includes('rent');
  const isDom = lowerQuery.includes('dom') || lowerQuery.includes('segment') || lowerQuery.includes('bliźniak') || lowerQuery.includes('willa');
  const isKawalerka = lowerQuery.includes('kawaler') || lowerQuery.includes('1 pok') || lowerQuery.includes('jednopokoj');
  const is3Rooms = lowerQuery.includes('3 pok') || lowerQuery.includes('trzypokoj');
  const isLokal = lowerQuery.includes('lokal') || lowerQuery.includes('biur') || lowerQuery.includes('magazyn');

  // Detect Polish city
  let city = 'Warszawa';
  let districts = ['Mokotów', 'Wola', 'Śródmieście', 'Ursynów', 'Ochota', 'Bielany'];

  const cityMatchers: Record<string, { city: string; districts: string[] }> = {
    'kraków': { city: 'Kraków', districts: ['Krowodrza', 'Podgórze', 'Stare Miasto', 'Grzegórzki', 'Dębniki'] },
    'krakow': { city: 'Kraków', districts: ['Krowodrza', 'Podgórze', 'Stare Miasto', 'Grzegórzki', 'Dębniki'] },
    'wrocław': { city: 'Wrocław', districts: ['Krzyki', 'Stare Miasto', 'Fabryczna', 'Śródmieście', 'Psie Pole'] },
    'wroclaw': { city: 'Wrocław', districts: ['Krzyki', 'Stare Miasto', 'Fabryczna', 'Śródmieście', 'Psie Pole'] },
    'poznań': { city: 'Poznań', districts: ['Jeżyce', 'Grunwald', 'Stare Miasto', 'Wilda', 'Rataje'] },
    'poznan': { city: 'Poznań', districts: ['Jeżyce', 'Grunwald', 'Stare Miasto', 'Wilda', 'Rataje'] },
    'gdańsk': { city: 'Gdańsk', districts: ['Przymorze', 'Śródmieście', 'Wrzeszcz', 'Oliwa', 'Zaspa'] },
    'gdansk': { city: 'Gdańsk', districts: ['Przymorze', 'Śródmieście', 'Wrzeszcz', 'Oliwa', 'Zaspa'] },
    'sopot': { city: 'Sopot', districts: ['Dolny Sopot', 'Górny Sopot', 'Kamienny Potok', 'Centrum'] },
    'gdynia': { city: 'Gdynia', districts: ['Śródmieście', 'Orłowo', 'Redłowo', 'Chwarzno', 'Wzgórze Św. Maksymiliana'] },
    'łódź': { city: 'Łódź', districts: ['Śródmieście', 'Bałuty', 'Widzew', 'Polesie', 'Górna'] },
    'lodz': { city: 'Łódź', districts: ['Śródmieście', 'Bałuty', 'Widzew', 'Polesie', 'Górna'] },
    'katowice': { city: 'Katowice', districts: ['Koszutka', 'Śródmieście', 'Brynów', 'Ligota', 'Dąb'] },
    'lublin': { city: 'Lublin', districts: ['Śródmieście', 'Czuby', 'Rury', 'Wieniawa', 'Czechów'] },
    'szczecin': { city: 'Szczecin', districts: ['Śródmieście', 'Pogodno', 'Niebuszewo', 'Warszewo'] },
    'bydgoszcz': { city: 'Bydgoszcz', districts: ['Śródmieście', 'Fordon', 'Bielawy', 'Bartodzieje'] },
    'białystok': { city: 'Białystok', districts: ['Centrum', 'Bojary', 'Nowe Miasto', 'Sienkiewicza'] },
    'bialystok': { city: 'Białystok', districts: ['Centrum', 'Bojary', 'Nowe Miasto', 'Sienkiewicza'] },
    'rzeszów': { city: 'Rzeszów', districts: ['Śródmieście', 'Nowe Miasto', 'Drabinianka', 'Zalesie'] },
    'rzeszow': { city: 'Rzeszów', districts: ['Śródmieście', 'Nowe Miasto', 'Drabinianka', 'Zalesie'] },
    'toruń': { city: 'Toruń', districts: ['Stare Miasto', 'Bydgoskie Przedmieście', 'Mokre', 'Rubinkowo'] },
    'torun': { city: 'Toruń', districts: ['Stare Miasto', 'Bydgoskie Przedmieście', 'Mokre', 'Rubinkowo'] }
  };

  for (const [key, val] of Object.entries(cityMatchers)) {
    if (lowerQuery.includes(key)) {
      city = val.city;
      districts = val.districts;
      break;
    }
  }

  // Check for specific district in query
  let selectedDistrict = districts[0];
  for (const dist of districts) {
    if (lowerQuery.includes(dist.toLowerCase())) {
      selectedDistrict = dist;
      break;
    }
  }

  // Check budget mentioned in query (e.g. "do 3500", "do 800 tys", "do 1 200 000")
  let targetPrice = 0;
  const priceMatch = lowerQuery.match(/do\s*([\d\s]+)\s*(zł|pln|tys)?/);
  if (priceMatch) {
    const rawVal = priceMatch[1].replace(/\s+/g, '');
    let num = parseInt(rawVal, 10);
    if (!isNaN(num)) {
      if (priceMatch[2] === 'tys' || num < 2000 && !isRent) {
        num *= 1000;
      }
      targetPrice = num;
    }
  }

  const catalog: Property[] = [
    {
      title: isDom 
        ? `Nowoczesny dom wolnostojący z ogrodem, ${city} (${selectedDistrict})` 
        : isKawalerka 
        ? `Stylowa kawalerka po remoncie z osobną kuchnią, ${city} ${selectedDistrict}`
        : is3Rooms
        ? `Komfortowe 3-pokojowe z loggią i klimatyzacją, ${city} ${selectedDistrict}`
        : isLokal
        ? `Funkcjonalny lokal biurowo-usługowy z witryną, ${city} ${selectedDistrict}`
        : `Nowoczesne 2-pokojowe mieszkanie z balkonem, ${city} ${selectedDistrict}`,
      location: `${city}, ${selectedDistrict}`,
      dealType: isRent ? 'Wynajem' : 'Sprzedaż',
      propertyType: isDom ? 'Dom' : isKawalerka ? 'Kawalerka' : isLokal ? 'Lokal komercyjny' : 'Mieszkanie',
      price: isRent 
        ? (targetPrice ? `${targetPrice.toLocaleString('pl-PL')} PLN / mies.` : isDom ? '8 500 PLN / mies.' : isKawalerka ? '2 600 PLN / mies.' : '3 400 PLN / mies.') 
        : (targetPrice ? `${targetPrice.toLocaleString('pl-PL')} PLN` : isDom ? '1 380 000 PLN' : isKawalerka ? '495 000 PLN' : '790 000 PLN'),
      priceNumeric: isRent 
        ? (targetPrice || (isDom ? 8500 : isKawalerka ? 2600 : 3400)) 
        : (targetPrice || (isDom ? 1380000 : isKawalerka ? 495000 : 790000)),
      pricePerM2: isRent ? (isDom ? '52 PLN/m²' : '71 PLN/m²') : (isDom ? '8 600 PLN/m²' : '16 100 PLN/m²'),
      area: isDom ? '160 m²' : isKawalerka ? '32 m²' : is3Rooms ? '68 m²' : '49 m²',
      rooms: isDom ? '5 pokoi' : isKawalerka ? '1 pokój' : is3Rooms ? '3 pokoje' : '2 pokoje',
      floor: isDom ? 'Parter + piętro' : '3/6 piętro',
      description: `Wysoki standard wykończenia. Mieszkanie w pełni umeblowane z kompletnym sprzętem AGD (zmywarka, lodówka, piekarnik, pralka). Jasne wnętrze z ekspozycją południowo-zachodnią, cicha i zielona okolica z doskonałym połączeniem komunikacyjnym.`,
      source: 'Otodom',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:otodom.pl "${isDom ? 'Nowoczesny dom wolnostojący z ogrodem' : isKawalerka ? 'Stylowa kawalerka po remoncie' : is3Rooms ? 'Komfortowe 3-pokojowe' : 'Nowoczesne 2-pokojowe mieszkanie'}" ${city} ${selectedDistrict}`)}`,
      contact: '+48 22 123 45 67 (Biuro Nieruchomości)',
      features: ['Balkon / Taras', 'Miejsce postojowe', 'Winda', 'Klimatyzacja', 'Ochrona'],
      isDirectOffer: true
    },
    {
      title: `Apartament w nowej inwestycji blisko węzła komunikacyjnego, ${city} ${districts[1] || selectedDistrict}`,
      location: `${city}, ${districts[1] || selectedDistrict}`,
      dealType: isRent ? 'Wynajem' : 'Sprzedaż',
      propertyType: 'Mieszkanie',
      price: isRent ? '3 800 PLN / mies.' : '880 000 PLN',
      priceNumeric: isRent ? 3800 : 880000,
      pricePerM2: isRent ? '69 PLN/m²' : '16 000 PLN/m²',
      area: '55 m²',
      rooms: '2 pokoje (salon + sypialnia)',
      floor: '4/8 piętro',
      description: `Inwestycja oddana do użytku w 2023 roku. Przestronny salon z aneksem kuchennym i wyspą, oddzielna sypialnia z dużą garderobą w zabudowie oraz łazienka z prysznicem walk-in. Dostępne od zaraz.`,
      source: 'OLX',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:olx.pl/d/oferta "Apartament w nowej inwestycji" ${city}`)}`,
      contact: '+48 600 987 654 (Osoba prywatna)',
      features: ['Balkon', 'Garaż podziemny', 'Komórka lokatorska', 'Winda', 'Zmywarka'],
      isDirectOffer: true
    },
    {
      title: `Przytulna kawalerka po generalnym remoncie, ${city} ${districts[2] || selectedDistrict}`,
      location: `${city}, ${districts[2] || selectedDistrict}`,
      dealType: isRent ? 'Wynajem' : 'Sprzedaż',
      propertyType: 'Kawalerka',
      price: isRent ? '2 550 PLN / mies.' : '515 000 PLN',
      priceNumeric: isRent ? 2550 : 515000,
      pricePerM2: isRent ? '82 PLN/m²' : '16 600 PLN/m²',
      area: '31 m²',
      rooms: '1 pokój (kawalerka)',
      floor: '2/4 piętro',
      description: `Idealna propozycja dla singla lub pary. Nowoczesna aranżacja wnętrza, pełne wyposażenie: pralka, zmywarka, lodówka, piekarnik, rozkładana sofa z funkcją spania. Bardzo niskie opłaty czynszowe.`,
      source: 'Morizon',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:morizon.pl/oferta "Przytulna kawalerka po generalnym remoncie" ${city}`)}`,
      contact: '+48 510 333 222 (Agent nieruchomości)',
      features: ['Po remoncie', 'Winda', 'Światłowód', 'Ciche', 'Blisko centrum'],
      isDirectOffer: true
    },
    {
      title: `Rozkładowe 3-pokojowe z loggią i osobną kuchnią, ${city} ${districts[3] || selectedDistrict}`,
      location: `${city}, ${districts[3] || selectedDistrict}`,
      dealType: isRent ? 'Wynajem' : 'Sprzedaż',
      propertyType: 'Mieszkanie',
      price: isRent ? '4 200 PLN / mies.' : '930 000 PLN',
      priceNumeric: isRent ? 4200 : 930000,
      pricePerM2: isRent ? '62 PLN/m²' : '13 700 PLN/m²',
      area: '68 m²',
      rooms: '3 pokoje',
      floor: '1/5 piętro',
      description: `Świetny, dwustronny rozkład pomieszczeń: duży salon z wyjściem na zadaszoną loggię, dwie niezależne sypialnie, oddzielna widna kuchnia i łazienka z wanną. W pobliżu park, sklepy i szkoła.`,
      source: 'Nieruchomości-online',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:nieruchomosci-online.pl "Rozkładowe 3-pokojowe z loggią" ${city}`)}`,
      contact: 'W ogłoszeniu (Agencja Partner)',
      features: ['Loggia', 'Piwnica', 'Winda', 'Osobna kuchnia', 'Plac zabaw'],
      isDirectOffer: true
    },
    {
      title: isDom ? `Segment narożny z dużym ogrodem, ${city}` : `Designerski apartament z antresolą i widokiem na panoramę, ${city}`,
      location: `${city}, ${districts[0]}`,
      dealType: isRent ? 'Wynajem' : 'Sprzedaż',
      propertyType: isDom ? 'Segment' : 'Apartament',
      price: isRent ? '5 400 PLN / mies.' : '1 180 000 PLN',
      priceNumeric: isRent ? 5400 : 1180000,
      pricePerM2: isRent ? '72 PLN/m²' : '15 700 PLN/m²',
      area: isDom ? '135 m²' : '75 m²',
      rooms: isDom ? '4 pokoje' : '3 pokoje',
      floor: isDom ? 'Dwupoziomowy' : 'Ostatnie piętro (7/7)',
      description: `Oferta dla wymagających klientów. Wysokie sufity (3.1m), klimatyzacja we wszystkich pokojach, system smart home oraz spektakularny widok na miasto.`,
      source: 'Gratka',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:gratka.pl "Designerski apartament" ${city}`)}`,
      contact: '+48 22 888 77 66 (Biuro Premium)',
      features: ['Klimatyzacja', 'Smart Home', 'Taras', 'Garaż podwójny', 'Winda'],
      isDirectOffer: true
    },
    {
      title: `Mieszkanie 2 pokoje z prywatnym ogródkiem na parterze, ${city} ${districts[1] || selectedDistrict}`,
      location: `${city}, ${districts[1] || selectedDistrict}`,
      dealType: isRent ? 'Wynajem' : 'Sprzedaż',
      propertyType: 'Mieszkanie',
      price: isRent ? '3 250 PLN / mies.' : '740 000 PLN',
      priceNumeric: isRent ? 3250 : 740000,
      pricePerM2: isRent ? '68 PLN/m²' : '15 400 PLN/m²',
      area: '48 m²',
      rooms: '2 pokoje',
      floor: 'Parter (ogródek 45 m²)',
      description: `Nowoczesne, strzeżone osiedle. Bezpośrednie wyjście z salonu do prywatnego, zielonego ogródka. Rolety antywłamaniowe, ogrzewanie podłogowe w łazience oraz naziemne miejsce postojowe w cenie.`,
      source: 'Otodom',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:otodom.pl "Mieszkanie 2 pokoje z prywatnym ogródkiem" ${city}`)}`,
      contact: '+48 690 111 222 (Właściciel)',
      features: ['Ogródek prywatny', 'Rolety zewnętrzne', 'Miejsce postojowe', 'Monitoring'],
      isDirectOffer: true
    }
  ];

  const normalized = catalog.map(p => {
    const phoneMatch = p.contact?.match(/\+48\s*[0-9\s-]+/);
    const phoneNumber = phoneMatch ? phoneMatch[0].trim() : undefined;
    return {
      ...p,
      hasPhoneNumber: Boolean(phoneNumber),
      phoneNumber
    };
  });

  normalized.sort((a, b) => (b.hasPhoneNumber ? 1 : 0) - (a.hasPhoneNumber ? 1 : 0));
  return normalized.slice(0, count);
}
