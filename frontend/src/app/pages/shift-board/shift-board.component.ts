import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { AuthService } from '../../core/auth.service';
import { ShiftsService } from '../../core/shifts.service';
import { apiErrorMessage } from '../../core/auth.interceptor';
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
export class ShiftBoardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly shiftsService = inject(ShiftsService);
  readonly isAdmin = this.auth.isAdmin;

  loading = signal(true);
  error = signal<string | null>(null);

  // Populated on init from GET /api/shifts (upcoming shifts with computed
  // openSlots + signedUp for the caller).
  shifts = signal<Shift[]>([]);

  readonly formatDay = formatDay;
  readonly formatTime = formatTime;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.shifts.set(await this.shiftsService.list());
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Could not load shifts.'));
    } finally {
      this.loading.set(false);
    }
  }

  open(shift: Shift): number {
    return openSlots(shift.capacity, shift.filled);
  }
}
