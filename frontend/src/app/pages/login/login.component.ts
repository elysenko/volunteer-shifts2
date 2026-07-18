import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiErrorMessage } from '../../core/auth.interceptor';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './auth.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  error = signal<string | null>(null);
  loading = signal(false);

  async submit(): Promise<void> {
    this.error.set(null);
    if (!this.email().trim() || !this.password()) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.email(), this.password());
      this.redirect();
    } catch (err) {
      this.error.set(apiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      this.loading.set(false);
    }
  }

  async demo(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.auth.demoLogin();
      this.redirect();
    } catch (err) {
      this.error.set(
        apiErrorMessage(err, 'Demo login is unavailable right now.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  private redirect(): void {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.router.navigateByUrl(returnUrl);
  }
}
