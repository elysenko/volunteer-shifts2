import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { AuthService } from '../../core/auth.service';
import { Shift } from '../../core/models';
import { formatDay, formatTime, openSlots } from '../../core/format';

@Component({
  selector: 'app-shift-board',
  standalone: true,
  imports: [RouterLink, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shift-board.component.html',
  styleUrl: './shift-board.component.css',
})
export class ShiftBoardComponent {
  private readonly auth = inject(AuthService);
  readonly isAdmin = this.auth.isAdmin;

  loading = signal(false);
  error = signal<string | null>(null);

  // Mock data — declared as a signal per the data contract so the
  // mockup_cleaner/service_agent stages can wire it to the live API.
  shifts = signal<Shift[]>([
    {
      id: 's1',
      role: 'Food Bank Sorter',
      location: 'Downtown Community Pantry',
      startsAt: '2026-07-22T09:00:00',
      hours: 3,
      capacity: 8,
      filled: 5,
      signedUp: false,
    },
    {
      id: 's2',
      role: 'Meal Server',
      location: 'Riverside Shelter',
      startsAt: '2026-07-23T17:30:00',
      hours: 4,
      capacity: 6,
      filled: 6,
      signedUp: false,
    },
    {
      id: 's3',
      role: 'Garden Volunteer',
      location: 'Hillcrest Community Garden',
      startsAt: '2026-07-25T08:00:00',
      hours: 2.5,
      capacity: 10,
      filled: 3,
      signedUp: true,
    },
    {
      id: 's4',
      role: 'Reading Buddy',
      location: 'Eastside Library',
      startsAt: '2026-07-26T14:00:00',
      hours: 2,
      capacity: 5,
      filled: 4,
      signedUp: false,
    },
    {
      id: 's5',
      role: 'Beach Cleanup Crew',
      location: 'Marina Bay Boardwalk',
      startsAt: '2026-07-28T07:30:00',
      hours: 3,
      capacity: 20,
      filled: 12,
      signedUp: false,
    },
  ]);

  readonly formatDay = formatDay;
  readonly formatTime = formatTime;

  open(shift: Shift): number {
    return openSlots(shift.capacity, shift.filled);
  }
}
