import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SeguridadService, Rol, Permiso } from '../../../shared/services/seguridad.service';
import { AuditService } from '../../../shared/services/audit.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-seg-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class SegRoles implements OnInit {
  roles: Rol[] = [];
  permisos: Permiso[] = [];

  msg = '';
  err = '';

  form;
  selectedRoleId = '';

  constructor(
    private fb: FormBuilder,
    private seg: SeguridadService,
    private audit: AuditService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    try {
      const [roles, permisos] = await Promise.all([
        this.seg.listRoles(),
        this.seg.listPermisos()
      ]);

      this.roles = roles;
      this.permisos = permisos;
    } catch (e: any) {
      this.err = e?.error?.message || e?.error?.msg || 'No se pudo cargar roles.';
    }
  }

  async create() {
    this.msg = '';
    this.err = '';

    if (this.form.invalid) {
      this.err = 'Nombre requerido.';
      return;
    }

    try {
      const name = String(this.form.value.name || '');
      await this.seg.createRol(name);

      const me = this.auth.getUser()?.username || 'admin';
      this.audit.log({
        user: me,
        type: 'CREATE',
        module: 'Seguridad/Roles',
        detail: `Creó rol: ${name}`
      });

      this.msg = 'Rol creado ✅';
      this.form.reset();
      await this.refresh();
    } catch (e: any) {
      this.err = e?.error?.message || e?.error?.msg || 'No se pudo crear el rol.';
    }
  }

  selectRole(id: string) {
    this.selectedRoleId = id;
  }

  role(): Rol | undefined {
    return this.roles.find(r => r.id === this.selectedRoleId);
  }

  hasPerm(permId: string): boolean {
    const r = this.role();
    if (!r) return false;
    return r.permisos.includes(permId);
  }

  async togglePerm(permId: string) {
    const r = this.role();
    if (!r) return;

    try {
      if (r.permisos.includes(permId)) {
        await this.seg.removePermisoFromRol(r.id, permId);
      } else {
        await this.seg.addPermisoToRol(r.id, permId);
      }

      const me = this.auth.getUser()?.username || 'admin';
      const permiso = this.permisos.find(p => p.id === permId);

      this.audit.log({
        user: me,
        type: 'UPDATE',
        module: 'Seguridad/Roles',
        detail: `Actualizó permisos de ${r.name}: ${permiso?.code || permId}`,
      });

      await this.refresh();
    } catch (e: any) {
      this.err = e?.error?.message || e?.error?.msg || 'No se pudo actualizar el permiso del rol.';
    }
  }

  async deleteRole(r: Rol) {
    try {
      await this.seg.deleteRol(r.id);

      const me = this.auth.getUser()?.username || 'admin';
      this.audit.log({
        user: me,
        type: 'DELETE',
        module: 'Seguridad/Roles',
        detail: `Eliminó rol: ${r.name}`
      });

      if (this.selectedRoleId === r.id) this.selectedRoleId = '';
      await this.refresh();
    } catch (e: any) {
      this.err = e?.error?.message || e?.error?.msg || 'No se pudo eliminar el rol.';
    }
  }
}