import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuditService } from '../../services/audit.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss',
})
export class UserMenu {
  open = false;

  // ✅ debe ser public porque el template lo usa
  constructor(public auth: AuthService, private router: Router, private audit: AuditService) {}

  toggle() {
    this.open = !this.open;
  }

  logout() {
    const u = this.auth.getUser()?.username || 'system';
    this.audit.add('LOGOUT', 'Cerró sesión', 'UserMenu', u);

    this.auth.logout();
    this.open = false;
    this.router.navigateByUrl('/login');
  }
}