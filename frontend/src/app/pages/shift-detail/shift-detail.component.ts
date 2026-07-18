import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { AuthService } from '../../core/auth.service';
import { ShiftsService } from '../../core/shifts.service';
import { apiErrorMessage } from '../../core/auth.interceptor';
import { Shift } from '../../core/models';
import { formatDay, formatTime, openSlots } from '../../core/format';

@Component({
  selector: 'app-shift-detail',
  standalone: true,
  imports: [RouterLink, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shift-detail.component.html',
  styleUrl: './shift-detail.component.css',
})
export class ShiftDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly shiftsService = inject(ShiftsService);
  readonly isAdmin = this.auth.isAdmin;

  loading = signal(true);
  error = signal<string | null>(null);
  signupPending = signal(false);
  signupMessage = signal<string | null>(null);

  readonly shiftId = signal(this.route.snapshot.paramMap.get('id') ?? '');

  // Loaded on init from GET /api/shifts/:id.
  readonly shift = signal<Shift | null>(null);

  readonly open = computed(() => {
    const s = this.shift();
    return s ? openSlots(s.capacity, s.filled) : 0;
  });

  readonly formatDay = formatDay;
  readonly formatTime = formatTime;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.shift.set(await this.shiftsService.get(this.shiftId()));
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Could not load this shift.'));
    } finally {
      this.loading.set(false);
    }
  }

  async signUp(): Promise<void> {
    const target = this.shift();
    if (!target || target.signedUp || this.open() <= 0) {
      return;
    }
    this.signupPending.set(true);
    this.error.set(null);
    try {
      const updated = await this.shiftsService.signUp(target.id);
      this.shift.set(updated);
      this.signupMessage.set("You're signed up! See it in My Shifts.");
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Could not sign you up.'));
    } finally {
      this.signupPending.set(false);
    }
  }
}
