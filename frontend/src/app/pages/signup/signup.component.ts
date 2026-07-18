import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup.component.html',
  styleUrl: '../login/auth.component.css',
})
export class SignupComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  name = signal('');
  email = signal('');
  password = signal('');
  confirm = signal('');
  error = signal<string | null>(null);
  loading = signal(false);

  submit(): void {
    this.error.set(null);
    if (!this.name().trim() || !this.email().trim() || !this.password()) {
      this.error.set('Please fill in every field.');
      return;
    }
    if (this.password().length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }
    if (this.password() !== this.confirm()) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.auth.signup(this.name(), this.email(), this.password());
    this.loading.set(false);
    this.router.navigateByUrl('/');
  }
}
