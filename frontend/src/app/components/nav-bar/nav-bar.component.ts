import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  exact: boolean;
  adminOnly: boolean;
}

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
})
export class NavBarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly isAdmin = this.auth.isAdmin;

  private readonly allItems: NavItem[] = [
    { label: 'Board', icon: '📋', path: '/', exact: true, adminOnly: false },
    {
      label: 'My Shifts',
      icon: '🗓️',
      path: '/my-shifts',
      exact: false,
      adminOnly: false,
    },
    {
      label: 'Volunteers',
      icon: '👥',
      path: '/volunteers',
      exact: false,
      adminOnly: true,
    },
    {
      label: 'New Shift',
      icon: '➕',
      path: '/shifts/new',
      exact: false,
      adminOnly: true,
    },
    {
      label: 'Settings',
      icon: '⚙️',
      path: '/admin/settings',
      exact: false,
      adminOnly: true,
    },
  ];

  readonly items = computed<NavItem[]>(() =>
    this.allItems.filter((i) => !i.adminOnly || this.isAdmin()),
  );

  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('') || 'V'
    );
  });

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
