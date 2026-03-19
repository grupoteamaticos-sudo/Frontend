import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-seg-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class SegPerfil {
  msg = '';
  err = '';

  form;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    const u = this.auth.getUser();

    this.form = this.fb.group({
      username: [u?.username || '', Validators.required],
      email: [u?.email || '', [Validators.required, Validators.email]],
      role: [u?.role || 'OPERADOR', Validators.required],
    });
  }

  guardar() {
    this.msg = '';
    this.err = '';

    if (this.form.invalid) {
      this.err = 'Completá los campos requeridos.';
      return;
    }

    const currentUser = this.auth.getUser();
    if (!currentUser) {
      this.err = 'No hay sesión activa.';
      return;
    }

    if (!this.auth.isBrowser()) {
      this.err = 'No se pudo acceder al almacenamiento local.';
      return;
    }

    try {
      const rawSession = localStorage.getItem('didadpol_session');
      if (!rawSession) {
        this.err = 'No se encontró la sesión actual.';
        return;
      }

      const session = JSON.parse(rawSession);
      const v = this.form.value;

      session.user = {
        ...session.user,
        username: String(v.username || '').trim(),
        email: String(v.email || '').trim(),
        // el rol solo se muestra, no se cambia desde perfil
        role: currentUser.role,
      };

      localStorage.setItem('didadpol_session', JSON.stringify(session));

      this.msg = 'Perfil actualizado ✅';
    } catch (error) {
      this.err = 'No se pudo actualizar el perfil.';
    }
  }
}