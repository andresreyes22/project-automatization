
import { APIRequestContext } from '@playwright/test';

// Leer URLs de APIs externas desde variables de entorno
const JSONPLACEHOLDER_URL = process.env.JSONPLACEHOLDER_URL || 'https://jsonplaceholder.typicode.com';
const QUOTABLE_API_URL = process.env.QUOTABLE_API_URL || 'https://api.quotable.io';
const PICSUM_URL = process.env.PICSUM_URL || 'https://picsum.photos';
const WORLDTIME_API_URL = process.env.WORLDTIME_API_URL || 'https://worldtimeapi.org';

/**
 * Utility class for fetching external data for testing
 */
export class ExternalDataProvider {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Fetch random user data from JSONPlaceholder API
   * @returns Promise with user data from external API
   */
  async getRandomUserFromJsonPlaceholder(): Promise<any> {
    try {
      const response = await this.request.get(`${JSONPLACEHOLDER_URL}/users/1`);
      const userData = await response.json();
      // Transform JSONPlaceholder user data to FakeStore format
      return {
        email: userData.email,
        username: userData.username.toLowerCase(),
        password: 'external123',
        name: {
          firstname: userData.name.split(' ')[0].toLowerCase(),
          lastname: userData.name.split(' ')[1]?.toLowerCase() || 'user'
        },
        address: {
          city: userData.address.city,
          street: userData.address.street,
          number: parseInt(userData.address.suite.replace(/\D/g, '')) || 1,
          zipcode: userData.address.zipcode,
          geolocation: {
            lat: userData.address.geo.lat,
            long: userData.address.geo.lng
          }
        },
        phone: userData.phone
      };
    } catch (error) {
      console.error('Fallo al obtener usuario externo, usando datos mockeados:', error);
      // Datos mockeados realistas en formato FakeStore
      return {
        email: 'mockuser@demo.com',
        username: 'mockuser',
        password: 'mock1234',
        name: {
          firstname: 'mock',
          lastname: 'user'
        },
        address: {
          city: 'Ciudad Demo',
          street: 'Calle Falsa',
          number: 123,
          zipcode: '00000',
          geolocation: {
            lat: '0.0000',
            long: '0.0000'
          }
        },
        phone: '123-456-7890'
      };
    }
  }

  /**
   * Fetch random quote for product description from quotable API
   * @returns Promise with quote text
   */
  async getRandomQuoteForProductDescription(): Promise<string> {
    try {
      const response = await this.request.get(`${QUOTABLE_API_URL}/random?maxLength=100`);
      const quoteData = await response.json();
      return quoteData.content;
    } catch (error) {
      console.error('Fallo al obtener frase externa, usando descripción mockeada:', error);
      return 'Descripción de producto mockeada por indisponibilidad de la API externa.';
    }
  }

  /**
   * Fetch random image URL from Lorem Picsum
   * @param width - Image width
   * @param height - Image height
   * @returns Promise with image URL
   */
  async getRandomImageUrl(width: number = 400, height: number = 400): Promise<string> {
    try {
      // Lorem Picsum provides random images
      const imageUrl = `${PICSUM_URL}/${width}/${height}`;
      // Verify the image URL is accessible
      const response = await this.request.get(imageUrl);
      if (response.status() === 200) {
        return imageUrl;
      }
      throw new Error('Image not accessible');
    } catch (error) {
      console.error('Fallo al obtener imagen externa, usando imagen mockeada:', error);
      return 'https://via.placeholder.com/400x400'; // Imagen mockeada
    }
  }

  /**
   * Fetch current date from WorldTimeAPI for cart dates
   * @returns Promise with current ISO date string
   */
  async getCurrentDateFromWorldTimeApi(): Promise<string> {
    try {
      const response = await this.request.get(`${WORLDTIME_API_URL}/api/timezone/UTC`);
      const timeData = await response.json();
      return timeData.utc_datetime;
    } catch (error) {
      console.error('Fallo al obtener fecha externa, usando fecha mockeada:', error);
      // Fecha mockeada: fecha local ISO
      return new Date().toISOString();
    }
  }

  /**
   * Validate external API availability
   * @returns Promise<boolean> indicating if external APIs are available
   */
  async validateExternalApiAvailability(): Promise<{
    jsonPlaceholder: boolean;
    quotable: boolean;
    picsum: boolean;
    worldTime: boolean;
  }> {
    const results = {
      jsonPlaceholder: false,
      quotable: false,
      picsum: false,
      worldTime: false
    };

    try {
      const jsonPlaceholderResponse = await this.request.get(`${JSONPLACEHOLDER_URL}/users/1`);
      results.jsonPlaceholder = jsonPlaceholderResponse.status() === 200;
    } catch {}

    try {
      const quotableResponse = await this.request.get(`${QUOTABLE_API_URL}/random`);
      results.quotable = quotableResponse.status() === 200;
    } catch {}

    try {
      const picsumResponse = await this.request.get(`${PICSUM_URL}/100/100`);
      results.picsum = picsumResponse.status() === 200;
    } catch {}

    try {
      const worldTimeResponse = await this.request.get(`${WORLDTIME_API_URL}/api/timezone/UTC`);
      results.worldTime = worldTimeResponse.status() === 200;
    } catch {}

    return results;
  }
}