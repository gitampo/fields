const GIBA_LAT = 39.0707;
const GIBA_LON = 8.6351;

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Sereno',
  1: 'Prevalentemente sereno',
  2: 'Parzialmente nuvoloso',
  3: 'Coperto',
  45: 'Nebbia',
  48: 'Nebbia intensa',
  51: 'Pioviggine leggera',
  53: 'Pioviggine moderata',
  55: 'Pioviggine intensa',
  56: 'Pioviggine gelata leggera',
  57: 'Pioviggine gelata intensa',
  61: 'Pioggia leggera',
  63: 'Pioggia moderata',
  65: 'Pioggia intensa',
  66: 'Pioggia gelata leggera',
  67: 'Pioggia gelata intensa',
  71: 'Neve leggera',
  73: 'Neve moderata',
  75: 'Neve intensa',
  77: 'Nevischio',
  80: 'Rovesci leggeri',
  81: 'Rovesci moderati',
  82: 'Rovesci violenti',
  85: 'Rovesci di neve leggeri',
  86: 'Rovesci di neve forti',
  95: 'Temporale',
  96: 'Temporale con grandine leggera',
  99: 'Temporale con grandine forte',
};

type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  weathercode: number[];
};

type OpenMeteoResponse = {
  hourly?: OpenMeteoHourly;
};

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const formatHour = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

const parseHourlyIsoAsLocal = (hourlyIso: string) => {
  // Open-Meteo with timezone=Europe/Rome returns local-time strings without timezone.
  return new Date(`${hourlyIso}:00`);
};

const pickClosestIndex = (times: string[], targetIso: string) => {
  if (times.length === 0) {
    return -1;
  }

  const target = new Date(targetIso).getTime();
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < times.length; i += 1) {
    const candidate = parseHourlyIsoAsLocal(times[i]).getTime();
    const distance = Math.abs(candidate - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
};

const buildWeatherLine = (time: string, temp: number, code: number, precipitationProb: number) => {
  const condition = WEATHER_CODE_LABELS[code] || 'Condizioni variabili';
  const roundedTemp = Math.round(temp);
  const roundedPrecip = Math.round(precipitationProb);
  return `${formatHour(time)}: ${condition}, ${roundedTemp}°C, pioggia ${roundedPrecip}%`;
};

export const getBookingWeatherSummary = async (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Orario prenotazione non valido');
  }

  const startDate = toDateOnly(start);
  const endDate = toDateOnly(end);

  const url = (
    `https://api.open-meteo.com/v1/forecast?latitude=${GIBA_LAT}&longitude=${GIBA_LON}`
    + `&hourly=temperature_2m,precipitation_probability,weathercode`
    + `&timezone=Europe%2FRome&start_date=${startDate}&end_date=${endDate}`
  );

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Servizio meteo non disponibile');
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const hourly = data.hourly;

  if (!hourly || !hourly.time || hourly.time.length === 0) {
    throw new Error('Dati meteo non disponibili');
  }

  const startIndex = pickClosestIndex(hourly.time, startIso);
  const endIndex = pickClosestIndex(hourly.time, endIso);

  if (startIndex < 0 || endIndex < 0) {
    throw new Error('Dati meteo non disponibili');
  }

  const startLine = buildWeatherLine(
    hourly.time[startIndex],
    hourly.temperature_2m[startIndex],
    hourly.weathercode[startIndex],
    hourly.precipitation_probability[startIndex],
  );

  const endLine = buildWeatherLine(
    hourly.time[endIndex],
    hourly.temperature_2m[endIndex],
    hourly.weathercode[endIndex],
    hourly.precipitation_probability[endIndex],
  );

  return {
    locationLabel: 'Giba, Sardegna',
    startLine,
    endLine,
  };
};
