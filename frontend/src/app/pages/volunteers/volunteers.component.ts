import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { VolunteersService } from '../../core/volunteers.service';
import { apiErrorMessage } from '../../core/auth.interceptor';
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
export class VolunteersComponent implements OnInit {
  private readonly volunteersService = inject(VolunteersService);

  loading = signal(true);
  error = signal<string | null>(null);

  // Loaded on init from GET /api/volunteers (admin roster).
  volunteers = signal<Volunteer[]>([]);

  readonly formatDay = formatDay;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.volunteers.set(await this.volunteersService.list());
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Could not load the roster.'));
    } finally {
      this.loading.set(false);
    }
  }
}
