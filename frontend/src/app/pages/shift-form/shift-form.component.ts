import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { Shift } from '../../core/models';

@Component({
  selector: 'app-shift-form',
  standalone: true,
  imports: [FormsModule, RouterLink, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shift-form.component.html',
  styleUrl: './shift-form.component.css',
})
export class ShiftFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  // Seed catalogue used to preload the form in edit mode — signal per the
  // data contract.
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
      id: 's3',
      role: 'Garden Volunteer',
      location: 'Hillcrest Community Garden',
      startsAt: '2026-07-25T08:00:00',
      hours: 2.5,
      capacity: 10,
      filled: 3,
      signedUp: true,
    },
  ]);

  role = signal('');
  location = signal('');
  startsAt = signal('');
  hours = signal<number | null>(null);
  capacity = signal<number | null>(null);

  submitted = signal(false);
  saved = signal(false);

  readonly roleError = computed(() =>
    this.submitted() && !this.role().trim() ? 'Role is required.' : null,
  );
  readonly locationError = computed(() =>
    this.submitted() && !this.location().trim() ? 'Location is required.' : null,
  );
  readonly startsAtError = computed(() =>
    this.submitted() && !this.startsAt() ? 'Start date & time is required.' : null,
  );
  readonly hoursError = computed(() =>
    this.submitted() && !(this.hours() && this.hours()! > 0)
      ? 'Hours must be greater than 0.'
      : null,
  );
  readonly capacityError = computed(() =>
    this.submitted() && !(this.capacity() && this.capacity()! >= 1)
      ? 'Capacity must be at least 1.'
      : null,
  );

  constructor() {
    if (this.isEdit) {
      const existing = this.shifts().find((s) => s.id === this.editId);
      if (existing) {
        this.role.set(existing.role);
        this.location.set(existing.location);
        this.startsAt.set(existing.startsAt.slice(0, 16));
        this.hours.set(existing.hours);
        this.capacity.set(existing.capacity);
      }
    }
  }

  save(): void {
    this.submitted.set(true);
    if (
      this.roleError() ||
      this.locationError() ||
      this.startsAtError() ||
      this.hoursError() ||
      this.capacityError()
    ) {
      return;
    }
    this.saved.set(true);
    setTimeout(() => this.router.navigate(['/']), 900);
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
