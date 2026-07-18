import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { ShiftsService, ShiftInput } from '../../core/shifts.service';
import { apiErrorMessage } from '../../core/auth.interceptor';

@Component({
  selector: 'app-shift-form',
  standalone: true,
  imports: [FormsModule, RouterLink, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shift-form.component.html',
  styleUrl: './shift-form.component.css',
})
export class ShiftFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shiftsService = inject(ShiftsService);

  readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = !!this.editId;

  role = signal('');
  location = signal('');
  startsAt = signal('');
  hours = signal<number | null>(null);
  capacity = signal<number | null>(null);

  submitted = signal(false);
  saved = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

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

  async ngOnInit(): Promise<void> {
    if (this.isEdit && this.editId) {
      try {
        const existing = await this.shiftsService.get(this.editId);
        this.role.set(existing.role);
        this.location.set(existing.location);
        this.startsAt.set(existing.startsAt.slice(0, 16));
        this.hours.set(existing.hours);
        this.capacity.set(existing.capacity);
      } catch (err) {
        this.error.set(apiErrorMessage(err, 'Could not load this shift.'));
      }
    }
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    this.error.set(null);
    if (
      this.roleError() ||
      this.locationError() ||
      this.startsAtError() ||
      this.hoursError() ||
      this.capacityError()
    ) {
      return;
    }

    const input: ShiftInput = {
      role: this.role().trim(),
      location: this.location().trim(),
      startsAt: this.startsAt(),
      hours: this.hours()!,
      capacity: this.capacity()!,
    };

    this.saving.set(true);
    try {
      if (this.isEdit && this.editId) {
        await this.shiftsService.update(this.editId, input);
      } else {
        await this.shiftsService.create(input);
      }
      this.saved.set(true);
      setTimeout(() => this.router.navigate(['/']), 900);
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Could not save the shift.'));
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
