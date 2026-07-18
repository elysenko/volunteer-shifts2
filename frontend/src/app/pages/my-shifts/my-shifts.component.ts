import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { Shift } from '../../core/models';
import { formatDay, formatTime } from '../../core/format';

@Component({
  selector: 'app-my-shifts',
  standalone: true,
  imports: [RouterLink, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-shifts.component.html',
  styleUrl: './my-shifts.component.css',
})
export class MyShiftsComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  // Shifts the signed-in volunteer has joined — signal per the data contract.
  shifts = signal<Shift[]>([
    {
      id: 's3',
      role: 'Garden Volunteer',
      location: 'Hillcrest Community Garden',
      startsAt: '2026-07-25T08:00:00',
      hours: 2.5,
      capacity: 10,
      filled: 4,
      signedUp: true,
    },
    {
      id: 's6',
      role: 'Toy Drive Packer',
      location: 'Warehouse 12, Industrial Park',
      startsAt: '2026-07-30T10:00:00',
      hours: 3,
      capacity: 15,
      filled: 9,
      signedUp: true,
    },
  ]);

  readonly totalHours = computed(() =>
    this.shifts().reduce((sum, s) => sum + s.hours, 0),
  );

  readonly formatDay = formatDay;
  readonly formatTime = formatTime;
}
