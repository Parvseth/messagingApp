import * as Calendar from 'expo-calendar';
import { EventPayload } from '../types/message';

export class EventService {
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  }

  static async createEvent(payload: EventPayload): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (calendars.length === 0) return false;

      const defaultCalendar = calendars.find(c => c.isPrimary) || calendars[0];

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: payload.title,
        startDate: new Date(payload.date),
        endDate: new Date(new Date(payload.date).getTime() + 60 * 60 * 1000), // +1 hour
        location: payload.location,
        notes: payload.description,
      });

      return true;
    } catch (error) {
      console.error('[EventService] Error creating event:', error);
      return false;
    }
  }
}
