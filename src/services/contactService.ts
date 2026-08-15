import * as Contacts from 'expo-contacts';
import { ContactPayload } from '../types/message';

export class ContactService {
  static async pickContact(): Promise<ContactPayload | null> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      // NOTE: expo-contacts doesn't have a built-in UI picker for a single contact.
      // In a real app, you would fetch the list and build a UI, 
      // or use a community library like `react-native-pick-contact`
      // For MVP, we'll fetch the first contact.
      
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      if (data.length > 0) {
        const contact = data[0];
        
        // Generate a simple vCard string
        let vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\n`;
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          vCard += `TEL:${contact.phoneNumbers[0].number}\n`;
        }
        vCard += 'END:VCARD';

        return {
          name: contact.name,
          vCard: vCard,
        };
      }
      return null;
    } catch (error) {
      console.error('[ContactService] Error picking contact:', error);
      return null;
    }
  }
}
