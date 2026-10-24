// EventRegistry contract config. Address + ABI are merged into src/contracts/deployment.json
// by `npm run deploy:events` in /blockchain.
import { Contract } from 'ethers';
import deployment from '../contracts/deployment.json';

const registry = (deployment as any).eventRegistry;

export interface EventItem {
  id: number;
  organizer: string;
  name: string;
  organizerName: string;
  serviceNeeded: string;
  attendees: number;
  eventDate: number; // unix seconds
}

export function getEventRegistry(runner: any) {
  if (!registry) throw new Error('Events contract is not deployed yet. Run `npm run deploy:events` in /blockchain.');
  return new Contract(registry.address, registry.abi, runner);
}

export async function fetchEvents(provider: any): Promise<EventItem[]> {
  const raw = await getEventRegistry(provider).getEvents();
  return raw
    .map((e: any) => ({
      id: Number(e.id),
      organizer: e.organizer,
      name: e.name,
      organizerName: e.organizerName,
      serviceNeeded: e.serviceNeeded,
      attendees: Number(e.attendees),
      eventDate: Number(e.eventDate),
    }))
    .reverse(); // newest first
}
