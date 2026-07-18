import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shift-board/shift-board.component').then(
        (m) => m.ShiftBoardComponent,
      ),
  },
  {
    path: 'shifts/new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/shift-form/shift-form.component').then(
        (m) => m.ShiftFormComponent,
      ),
  },
  {
    path: 'shifts/:id/edit',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/shift-form/shift-form.component').then(
        (m) => m.ShiftFormComponent,
      ),
  },
  {
    path: 'shifts/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shift-detail/shift-detail.component').then(
        (m) => m.ShiftDetailComponent,
      ),
  },
  {
    path: 'my-shifts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-shifts/my-shifts.component').then(
        (m) => m.MyShiftsComponent,
      ),
  },
  {
    path: 'volunteers',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/volunteers/volunteers.component').then(
        (m) => m.VolunteersComponent,
      ),
  },
  {
    path: 'admin/settings',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin-settings/admin-settings.component').then(
        (m) => m.AdminSettingsComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
