const OPENWEATHERMAP_API_URL = "https://api.openweathermap.org/data/2.5/weather";
import { eq, and, or } from "drizzle-orm";
import { logger } from "../infrastructure/logger";

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  precipitation: number;
  condition: string;
  description: string;
  icon: string;
  isOutdoor: boolean;
  gameImpact: 'favorable' | 'moderate' | 'severe';
}

interface WeatherCacheEntry {
  data: WeatherData;
  timestamp: number;
}

const NFL_STADIUMS: Record<string, { lat: number; lon: number; name: string; isOutdoor: boolean }> = {
  "Allegiant Stadium": { lat: 36.0909, lon: -115.1833, name: "Las Vegas", isOutdoor: false },
  "Arrowhead Stadium": { lat: 39.0489, lon: -94.4839, name: "Kansas City", isOutdoor: true },
  "AT&T Stadium": { lat: 32.7473, lon: -97.0945, name: "Arlington", isOutdoor: false },
  "Bank of America Stadium": { lat: 35.2258, lon: -80.8528, name: "Charlotte", isOutdoor: true },
  "Caesars Superdome": { lat: 29.9511, lon: -90.0812, name: "New Orleans", isOutdoor: false },
  "Empower Field at Mile High": { lat: 39.7439, lon: -105.0201, name: "Denver", isOutdoor: true },
  "Ford Field": { lat: 42.3400, lon: -83.0456, name: "Detroit", isOutdoor: false },
  "GEHA Field at Arrowhead Stadium": { lat: 39.0489, lon: -94.4839, name: "Kansas City", isOutdoor: true },
  "Gillette Stadium": { lat: 42.0909, lon: -71.2643, name: "Foxborough", isOutdoor: true },
  "Hard Rock Stadium": { lat: 25.9580, lon: -80.2389, name: "Miami Gardens", isOutdoor: true },
  "Highmark Stadium": { lat: 42.7738, lon: -78.7870, name: "Orchard Park", isOutdoor: true },
  "Huntington Bank Field": { lat: 41.5061, lon: -81.6995, name: "Cleveland", isOutdoor: true },
  "TIAA Bank Field": { lat: 30.3239, lon: -81.6373, name: "Jacksonville", isOutdoor: true },
  "Lambeau Field": { lat: 44.5013, lon: -88.0622, name: "Green Bay", isOutdoor: true },
  "Levi's Stadium": { lat: 37.4033, lon: -121.9694, name: "Santa Clara", isOutdoor: true },
  "Lincoln Financial Field": { lat: 39.9008, lon: -75.1675, name: "Philadelphia", isOutdoor: true },
  "Lucas Oil Stadium": { lat: 39.7601, lon: -86.1639, name: "Indianapolis", isOutdoor: false },
  "Lumen Field": { lat: 47.5952, lon: -122.3316, name: "Seattle", isOutdoor: true },
  "M&T Bank Stadium": { lat: 39.2780, lon: -76.6227, name: "Baltimore", isOutdoor: true },
  "Mercedes-Benz Stadium": { lat: 33.7553, lon: -84.4006, name: "Atlanta", isOutdoor: false },
  "Mercedes-Benz Superdome": { lat: 29.9511, lon: -90.0812, name: "New Orleans", isOutdoor: false },
  "MetLife Stadium": { lat: 40.8128, lon: -74.0742, name: "East Rutherford", isOutdoor: true },
  "Nissan Stadium": { lat: 36.1665, lon: -86.7713, name: "Nashville", isOutdoor: true },
  "NRG Stadium": { lat: 29.6847, lon: -95.4107, name: "Houston", isOutdoor: false },
  "Paycor Stadium": { lat: 39.0954, lon: -84.5160, name: "Cincinnati", isOutdoor: true },
  "Raymond James Stadium": { lat: 27.9759, lon: -82.5033, name: "Tampa", isOutdoor: true },
  "SoFi Stadium": { lat: 33.9534, lon: -118.3390, name: "Inglewood", isOutdoor: true },
  "Soldier Field": { lat: 41.8623, lon: -87.6167, name: "Chicago", isOutdoor: true },
  "State Farm Stadium": { lat: 33.5276, lon: -112.2626, name: "Glendale", isOutdoor: false },
  "U.S. Bank Stadium": { lat: 44.9737, lon: -93.2577, name: "Minneapolis", isOutdoor: false },
};

const DEFAULT_COORDS = { lat: 39.8283, lon: -98.5795, name: "Central US", isOutdoor: true };

const weatherCache = new Map<string, WeatherCacheEntry>();
const CACHE_DURATION_MS = 60 * 60 * 1000;

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function assessGameImpact(weather: WeatherData): 'favorable' | 'moderate' | 'severe' {
  if (!weather.isOutdoor) return 'favorable';
  
  if (weather.windSpeed > 20 || weather.temperature < 20 || weather.precipitation > 0.3) {
    return 'severe';
  }
  if (weather.windSpeed > 12 || weather.temperature < 35 || weather.precipitation > 0.1) {
    return 'moderate';
  }
  return 'favorable';
}

export async function getWeatherForVenue(venue: string | null): Promise<WeatherData> {
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    logger.warn({ 
      type: "weather_api_key_missing", 
      venue,
      message: "WEATHER_API_KEY not configured - returning mock weather data" 
    });
    return getMockWeather(venue);
  }
  
  const stadiumInfo = venue ? NFL_STADIUMS[venue] : null;
  const location = stadiumInfo || DEFAULT_COORDS;
  const cacheKey = `${location.lat},${location.lon}`;
  
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  
  try {
    const url = `${OPENWEATHERMAP_API_URL}?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=imperial`;
    const response = await fetch(url);
    
    if (!response.ok) {
      logger.error({ 
        type: "weather_api_error", 
        status: response.status, 
        venue,
        message: `Weather API returned status ${response.status}` 
      });
      return getMockWeather(venue);
    }
    
    const data = await response.json();
    
    const weather: WeatherData = {
      temperature: Math.round(data.main?.temp || 70),
      feelsLike: Math.round(data.main?.feels_like || 70),
      windSpeed: Math.round(data.wind?.speed || 0),
      windDirection: getWindDirection(data.wind?.deg || 0),
      humidity: data.main?.humidity || 50,
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      condition: data.weather?.[0]?.main || 'Clear',
      description: data.weather?.[0]?.description || 'clear sky',
      icon: data.weather?.[0]?.icon || '01d',
      isOutdoor: location.isOutdoor ?? true,
    } as WeatherData;
    
    weather.gameImpact = assessGameImpact(weather);
    
    weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });
    
    return weather;
  } catch (error) {
    logger.error({ 
      type: "weather_fetch_failed", 
      venue,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return getMockWeather(venue);
  }
}

function getMockWeather(venue: string | null): WeatherData {
  const stadiumInfo = venue ? NFL_STADIUMS[venue] : null;
  const isOutdoor = stadiumInfo?.isOutdoor ?? true;
  
  const weather: WeatherData = {
    temperature: 55 + Math.floor(Math.random() * 25),
    feelsLike: 53 + Math.floor(Math.random() * 25),
    windSpeed: Math.floor(Math.random() * 15),
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    humidity: 40 + Math.floor(Math.random() * 40),
    precipitation: 0,
    condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
    description: 'partly cloudy',
    icon: '02d',
    isOutdoor,
  } as WeatherData;
  
  weather.gameImpact = assessGameImpact(weather);
  
  return weather;
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    return getMockWeather(null);
  }
  
  const cacheKey = `city:${city.toLowerCase()}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }
  
  try {
    const url = `${OPENWEATHERMAP_API_URL}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return getMockWeather(null);
    }
    
    const data = await response.json();
    
    const weather: WeatherData = {
      temperature: Math.round(data.main?.temp || 70),
      feelsLike: Math.round(data.main?.feels_like || 70),
      windSpeed: Math.round(data.wind?.speed || 0),
      windDirection: getWindDirection(data.wind?.deg || 0),
      humidity: data.main?.humidity || 50,
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      condition: data.weather?.[0]?.main || 'Clear',
      description: data.weather?.[0]?.description || 'clear sky',
      icon: data.weather?.[0]?.icon || '01d',
      isOutdoor: true,
    } as WeatherData;
    
    weather.gameImpact = assessGameImpact(weather);
    
    weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });
    
    return weather;
  } catch (error) {
    logger.error({ 
      type: "weather_fetch_by_city_failed", 
      city,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return getMockWeather(null);
  }
}

export function isOutdoorStadium(venue: string | null): boolean {
  if (!venue) return true;
  return NFL_STADIUMS[venue]?.isOutdoor ?? true;
}

export const WeatherService = {
  getWeatherForVenue,
  getWeatherByCity,
  isOutdoorStadium,
  NFL_STADIUMS,
};
