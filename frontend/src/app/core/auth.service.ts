import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Role, User } from './models';

const STORAGE_KEY = 'shifthands.auth';

interface StoredAuth {
  token: string;
  user: User;
}

interface AuthResult {
  token: string;
  user: User;
}

/** Seeded demo coordinator used by the "Demo Mode" shortcut. */
const DEMO_ADMIN = { email: 'admin@demo.org', password: 'admin1234' };

/**
 * Auth service wired to the live NestJS `/api/auth/*` endpoints.
 *
 * `login`/`signup` POST real credentials and persist the returned JWT + user;
 * `demoLogin` signs in as the seeded coordinator so reviewers can inspect the
 * admin-only screens. The stored token is attached to every API request by the
 * auth interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<User | null>(this.restore()?.user ?? null);
  private readonly _token = signal<string | null>(
    this.restore()?.token ?? null,
  );

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResult>('/api/auth/login', {
        email: email.trim(),
        password,
      }),
    );
    this.persist(res.user, res.token);
  }

  async signup(name: string, email: string, password: string): Promise<void> {
    // Public signup always creates a volunteer (USER) account server-side.
    const res = await firstValueFrom(
      this.http.post<AuthResult>('/api/auth/signup', {
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    );
    this.persist(res.user, res.token);
  }

  async demoLogin(): Promise<void> {
    await this.login(DEMO_ADMIN.email, DEMO_ADMIN.password);
  }

  logout(): void {
    this._user.set(null);
    this._token.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    } catch {
      /* ignore */
    }
  }

  private persist(user: User, token: string): void {
    this._user.set(user);
    this._token.set(token);
    try {
      const payload: StoredAuth = { token, user };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
    } catch {
      /* ignore */
    }
  }

  private restore(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredAuth) : null;
    } catch {
      return null;
    }
  }

  roleLabel(role: Role): string {
    return role === 'ADMIN' ? 'Coordinator' : 'Volunteer';
  }
}
