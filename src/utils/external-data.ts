import { APIRequestContext } from '@playwright/test';

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
      const response = await this.request.get('https://jsonplaceholder.typicode.com/users/1');
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
      console.error('Failed to fetch external user data:', error);
      throw new Error('External API unavailable');
    }
  }

  /**
   * Fetch random quote for product description from quotable API
   * @returns Promise with quote text
   */
  async getRandomQuoteForProductDescription(): Promise<string> {
    try {
      const response = await this.request.get('https://api.quotable.io/random?maxLength=100');
      const quoteData = await response.json();
      return quoteData.content;
    } catch (error) {
      console.error('Failed to fetch external quote:', error);
      return 'Default product description when external API is unavailable';
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
      const imageUrl = `https://picsum.photos/${width}/${height}`;
      
      // Verify the image URL is accessible
      const response = await this.request.get(imageUrl);
      if (response.status() === 200) {
        return imageUrl;
      }
      throw new Error('Image not accessible');
    } catch (error) {
      console.error('Failed to fetch external image:', error);
      return 'https://via.placeholder.com/400x400'; // Fallback placeholder
    }
  }

  /**
   * Fetch current date from WorldTimeAPI for cart dates
   * @returns Promise with current ISO date string
   */
  async getCurrentDateFromWorldTimeApi(): Promise<string> {
    try {
      const response = await this.request.get('https://worldtimeapi.org/api/timezone/UTC');
      const timeData = await response.json();
      return timeData.utc_datetime;
    } catch (error) {
      console.error('Failed to fetch external date:', error);
      return new Date().toISOString(); // Fallback to local date
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
      const jsonPlaceholderResponse = await this.request.get('https://jsonplaceholder.typicode.com/users/1');
      results.jsonPlaceholder = jsonPlaceholderResponse.status() === 200;
    } catch {}

    try {
      const quotableResponse = await this.request.get('https://api.quotable.io/random');
      results.quotable = quotableResponse.status() === 200;
    } catch {}

    try {
      const picsumResponse = await this.request.get('https://picsum.photos/100/100');
      results.picsum = picsumResponse.status() === 200;
    } catch {}

    try {
      const worldTimeResponse = await this.request.get('https://worldtimeapi.org/api/timezone/UTC');
      results.worldTime = worldTimeResponse.status() === 200;
    } catch {}

    return results;
  }
}