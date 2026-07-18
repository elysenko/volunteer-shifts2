import { Injectable, computed, signal } from '@angular/core';
import { Role, User } from './models';

const STORAGE_KEY = 'shifthands.auth';

interface StoredAuth {
  token: string;
  user: User;
}

/**
 * Mockup auth service.
 *
 * Uses local state only (no backend). `login`/`signup` accept any credentials
 * and produce a session; `demoLogin` provisions a mock ADMIN so reviewers and
 * the screenshot capture system can inspect every authenticated screen without
 * a live backend. The service_agent stage will later wire these methods to the
 * real /api/auth/* (or tRPC) endpoints.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this.restore()?.user ?? null);
  private readonly _token = signal<string | null>(
    this.restore()?.token ?? null,
  );

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  login(email: string, _password: string): void {
    const isAdmin = email.trim().toLowerCase().startsWith('admin');
    this.persist({
      id: isAdmin ? 'u-admin' : 'u-me',
      email: email.trim(),
      name: this.nameFromEmail(email),
      role: isAdmin ? 'ADMIN' : 'USER',
    });
  }

  signup(name: string, email: string, _password: string): void {
    // Public signup always creates a volunteer (USER) account.
    this.persist({
      id: 'u-me',
      email: email.trim(),
      name: name.trim() || this.nameFromEmail(email),
      role: 'USER',
    });
  }

  demoLogin(): void {
    this.persist({
      id: 'u-admin',
      email: 'admin@demo.org',
      name: 'Demo Admin',
      role: 'ADMIN',
    });
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

  private persist(user: User): void {
    const token = `mock.${user.role}.${user.id}`;
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

  private nameFromEmail(email: string): string {
    const local = email.split('@')[0] ?? 'Volunteer';
    return local
      .split(/[._-]/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  roleLabel(role: Role): string {
    return role === 'ADMIN' ? 'Coordinator' : 'Volunteer';
  }
}
