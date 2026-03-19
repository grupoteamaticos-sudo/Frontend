import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SeguridadService, Permiso } from '../../../shared/services/seguridad.service';
import { AuditService } from '../../../shared/services/audit.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-seg-permisos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permisos.html',
  styleUrl: './permisos.scss',
})
export class SegPermisos implements OnInit {
  permisos: Permiso[] = [];
  msg = '';
  err = '';

  form;

  constructor(
    private fb: FormBuilder,
    private seg: SeguridadService,
    private audit: AuditService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    try {
      this.permisos = await this.seg.listPermisos();
    } catch (e: any) {
      this.err = e?.error?.message || e?.error?.msg || 'No se pudo cargar permisos.';
    }
  }

  async create() {
    this.msg = '';
    this.err = '';

    if (this.form.invalid) {
      this.err = 'Code y nombre son requeridos.';
      return;
    }

    try {
      const v = this.form.value;

      await this.seg.createPermiso({
        code: String(v.code || ''),
        name: String(v.name || ''),
      });

      const me = this.auth.getUser()?.username || 'admin';
      this.audit.log({
        user: me,
        type: 'CREATE',
        module: 'Seguridad/Permisos',
        detail: `Creó permiso: ${v.code}`,
      });

      this.msg = 'Permiso creado ✅';
      this.form.reset();
      await this.refresh();
    } catch (e: any) {
      this.err = e?.error?.message || e?.error?.msg || 'No se pudo crear el permiso.';
    }
  }

  async delete(p: Permiso) {
    try {
      await this.seg.deletePermiso(p.id);

      const me = this.auth.getUser()?.username || 'admin';
      this.audit.log({
        user: me,
        type: 'DELETE',
        module: 'Seguridad/Permisos',
        detail: `Eliminó permiso: ${p.code}`
      });

      await this.refresh();
    } catch (e: any) {
      this.err = e?.error?.message || e?.error?.msg || 'No se pudo eliminar el permiso.';
    }
  }
}