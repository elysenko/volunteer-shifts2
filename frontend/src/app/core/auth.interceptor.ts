import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const STORAGE_KEYS = [
  'shifthands.auth',
  'token',
  'access_token',
  'user',
  'isAuthenticated',
];

/**
 * Attaches the stored JWT as a Bearer token to every same-origin `/api`
 * request and, on a 401, clears the session and bounces the user to /login
 * (preserving the intended URL so deep links survive re-authentication).
 *
 * Reads the token straight from localStorage rather than injecting AuthService
 * to avoid a construction cycle (HttpClient → interceptor → AuthService →
 * HttpClient).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  let token: string | null = null;
  try {
    token = localStorage.getItem('token');
  } catch {
    token = null;
  }

  const authed =
    token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  const isAuthEndpoint = req.url.includes('/api/auth/');

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthEndpoint) {
        try {
          for (const key of STORAGE_KEYS) {
            localStorage.removeItem(key);
          }
        } catch {
          /* ignore */
        }
        const returnUrl = router.url && router.url !== '/login' ? router.url : '/';
        void router.navigate(['/login'], { queryParams: { returnUrl } });
      }
      return throwError(() => err);
    }),
  );
};

/** Extract a human-readable message from a NestJS/HTTP error response. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as
      | { message?: string | string[] }
      | string
      | undefined;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object' && body.message) {
      return Array.isArray(body.message)
        ? body.message.join(', ')
        : String(body.message);
    }
    if (err.status === 0) {
      return 'Cannot reach the server. Please try again.';
    }
  }
  return fallback;
}
