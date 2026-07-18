import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

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

  submit(): void {
    this.error.set(null);
    if (!this.email().trim() || !this.password()) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email(), this.password());
    this.loading.set(false);
    this.redirect();
  }

  demo(): void {
    this.auth.demoLogin();
    this.redirect();
  }

  private redirect(): void {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.router.navigateByUrl(returnUrl);
  }
}
