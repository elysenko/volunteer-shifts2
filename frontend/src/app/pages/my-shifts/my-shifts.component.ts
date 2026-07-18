import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { ShiftsService } from '../../core/shifts.service';
import { apiErrorMessage } from '../../core/auth.interceptor';
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
export class MyShiftsComponent implements OnInit {
  private readonly shiftsService = inject(ShiftsService);

  loading = signal(true);
  error = signal<string | null>(null);

  // Loaded on init from GET /api/me/shifts.
  shifts = signal<Shift[]>([]);

  readonly totalHours = computed(() =>
    this.shifts().reduce((sum, s) => sum + s.hours, 0),
  );

  readonly formatDay = formatDay;
  readonly formatTime = formatTime;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.shifts.set(await this.shiftsService.mine());
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Could not load your shifts.'));
    } finally {
      this.loading.set(false);
    }
  }
}
