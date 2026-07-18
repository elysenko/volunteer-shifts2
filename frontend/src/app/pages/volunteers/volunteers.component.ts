import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { Volunteer } from '../../core/models';
import { formatDay } from '../../core/format';

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './volunteers.component.html',
  styleUrl: './volunteers.component.css',
})
export class VolunteersComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  // Roster of USER-role volunteers — signal per the data contract.
  volunteers = signal<Volunteer[]>([
    {
      id: 'v1',
      name: 'Jordan Rivera',
      email: 'jordan.rivera@example.org',
      totalHours: 12.5,
      shifts: [
        {
          id: 's3',
          role: 'Garden Volunteer',
          location: 'Hillcrest Community Garden',
          startsAt: '2026-07-25T08:00:00',
          hours: 2.5,
        },
        {
          id: 's1',
          role: 'Food Bank Sorter',
          location: 'Downtown Community Pantry',
          startsAt: '2026-07-22T09:00:00',
          hours: 3,
        },
        {
          id: 's5',
          role: 'Beach Cleanup Crew',
          location: 'Marina Bay Boardwalk',
          startsAt: '2026-07-28T07:30:00',
          hours: 3,
        },
      ],
    },
    {
      id: 'v2',
      name: 'Sam Chen',
      email: 'sam.chen@example.org',
      totalHours: 7,
      shifts: [
        {
          id: 's2',
          role: 'Meal Server',
          location: 'Riverside Shelter',
          startsAt: '2026-07-23T17:30:00',
          hours: 4,
        },
        {
          id: 's4',
          role: 'Reading Buddy',
          location: 'Eastside Library',
          startsAt: '2026-07-26T14:00:00',
          hours: 2,
        },
      ],
    },
    {
      id: 'v3',
      name: 'Priya Nair',
      email: 'priya.nair@example.org',
      totalHours: 3,
      shifts: [
        {
          id: 's5',
          role: 'Beach Cleanup Crew',
          location: 'Marina Bay Boardwalk',
          startsAt: '2026-07-28T07:30:00',
          hours: 3,
        },
      ],
    },
    {
      id: 'v4',
      name: 'Diego Fuentes',
      email: 'diego.fuentes@example.org',
      totalHours: 0,
      shifts: [],
    },
  ]);

  readonly formatDay = formatDay;
}
