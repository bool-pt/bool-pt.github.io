import type { APIResponse, EventScheduleData } from '@bool/shared';
import { post } from './submitters';

export function submitEventSchedule(data: EventScheduleData): Promise<APIResponse> {
  return post(
    '/event',
    {
      event_name: data.eventName,
      name: data.name,
      phone: data.phone,
      email: data.email,
      time_suggestion: data.timeSuggestion,
      message: data.message,
      turnstile_token: data.turnstileToken,
    },
    'Event schedule request'
  );
}
