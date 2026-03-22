import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type Permiso = {
  id: string;
  code: string;
  name: string;
  description?: string;
  activo?: boolean;
};

export type Rol = {
  id: string;
  name: string;
  description?: string;
  activo?: boolean;
  permisos: string[];
};

export type Usuario = {
  id: string;
  idEmpleado: string;
  username: string;
  email: string;
  activo: boolean;
  bloqueado: boolean;
  roles: string[];
};

@Injectable({ providedIn: 'root' })
export class SeguridadService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private headers(): HttpHeaders {
    const token = this.auth.getAccessToken() || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // =========================================================
  // PERMISOS
  // =========================================================
  async listPermisos(): Promise<Permiso[]> {
    const res: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/permisos`, {
        headers: this.headers(),
      })
    );

    const data = Array.isArray(res?.permisos) ? res.permisos : [];

    return data.map((p: any) => ({
      id: String(p.id_permiso),
      code: String(p.codigo_permiso || ''),
      name: String(p.nombre_permiso || ''),
      description: String(p.descripcion_permiso || ''),
      activo: String(p.estado_permiso || 'ACTIVO') === 'ACTIVO',
    }));
  }

  async createPermiso(p: { code: string; name: string; description?: string }) {
    const payload = {
      codigo_permiso: p.code.trim(),
      nombre_permiso: p.name.trim(),
      descripcion_permiso: (p.description || '').trim(),
    };

    return await firstValueFrom(
      this.http.post(`${this.apiUrl}/permisos`, payload, {
        headers: this.headers(),
      })
    );
  }

  async deletePermiso(id: string) {
    return await firstValueFrom(
      this.http.delete(`${this.apiUrl}/permisos/${id}`, {
        headers: this.headers(),
      })
    );
  }

  // =========================================================
  // ROLES
  // =========================================================
  async listRoles(): Promise<Rol[]> {
    const res: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/roles`, {
        headers: this.headers(),
      })
    );

    const data = Array.isArray(res?.roles) ? res.roles : [];

    return data.map((r: any) => ({
      id: String(r.id_rol),
      name: String(r.nombre_rol || ''),
      description: String(r.descripcion_rol || ''),
      activo: String(r.estado_rol || 'ACTIVO') === 'ACTIVO',
      permisos: Array.isArray(r.permisos)
        ? r.permisos.map((p: any) => String(p.id_permiso))
        : [],
    }));
  }

  async createRol(name: string, description = '') {
    const payload = {
      nombre_rol: name.trim(),
      descripcion_rol: description.trim(),
    };

    return await firstValueFrom(
      this.http.post(`${this.apiUrl}/roles`, payload, {
        headers: this.headers(),
      })
    );
  }

  async updateRol(id: string, patch: any) {
    return await firstValueFrom(
      this.http.patch(`${this.apiUrl}/roles/${id}`, patch, {
        headers: this.headers(),
      })
    );
  }

  async deleteRol(id: string) {
    return await firstValueFrom(
      this.http.delete(`${this.apiUrl}/roles/${id}`, {
        headers: this.headers(),
      })
    );
  }

  async addPermisoToRol(roleId: string, permisoId: string) {
    return await firstValueFrom(
      this.http.post(
        `${this.apiUrl}/roles/${roleId}/permisos`,
        { id_permiso: Number(permisoId) },
        { headers: this.headers() }
      )
    );
  }

  async removePermisoFromRol(roleId: string, permisoId: string) {
    return await firstValueFrom(
      this.http.delete(`${this.apiUrl}/roles/${roleId}/permisos`, {
        headers: this.headers(),
        body: { id_permiso: Number(permisoId) }
      })
    );
  }

  // =========================================================
  // USUARIOS
  // =========================================================
  async listUsuarios(): Promise<Usuario[]> {
    const res: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/usuarios`, {
        headers: this.headers(),
      })
    );

    const data = Array.isArray(res?.data) ? res.data : [];

    return data.map((u: any) => ({
      id: String(u.id_usuario),
      idEmpleado: String(u.id_empleado ?? ''),
      username: String(u.nombre_usuario || ''),
      email: String(u.correo_login || ''),
      activo: String(u.estado_usuario || 'ACTIVO') === 'ACTIVO',
      bloqueado: !!u.bloqueado,
      roles: Array.isArray(u.roles)
        ? u.roles.map((r: any) => String(r.id_rol))
        : [],
    }));
  }

  async createUsuario(u: {
    idEmpleado: string;
    username: string;
    email: string;
    password: string;
    activo: boolean;
    roleId: string;
  }) {
    const payload = {
      id_empleado: Number(u.idEmpleado),
      nombre_usuario: u.username.trim(),
      password: u.password,
      correo_login: u.email.trim(),
      id_rol: Number(u.roleId),
      activo: !!u.activo,
    };

    return await firstValueFrom(
      this.http.post(`${this.apiUrl}/usuarios`, payload, {
        headers: this.headers(),
      })
    );
  }

  async updateUsuario(
    id: string,
    patch: {
      idEmpleado?: string;
      username?: string;
      email?: string;
      activo?: boolean;
      bloqueado?: boolean;
      roleId?: string;
    }
  ) {
    const payload: any = {};

    if (patch.idEmpleado !== undefined) payload.id_empleado = Number(patch.idEmpleado);
    if (patch.username !== undefined) payload.nombre_usuario = patch.username.trim();
    if (patch.email !== undefined) payload.correo_login = patch.email.trim();
    if (patch.activo !== undefined) payload.estado_usuario = patch.activo ? 'ACTIVO' : 'INACTIVO';
    if (patch.bloqueado !== undefined) payload.bloqueado = patch.bloqueado;
    if (patch.roleId !== undefined) payload.id_rol = Number(patch.roleId);

    return await firstValueFrom(
      this.http.patch(`${this.apiUrl}/usuarios/${id}`, payload, {
        headers: this.headers(),
      })
    );
  }

  async toggleActivo(id: string) {
    return await firstValueFrom(
      this.http.patch(`${this.apiUrl}/usuarios/${id}/bloqueo`, {}, {
        headers: this.headers(),
      })
    );
  }

  async deleteUsuario(id: string) {
    return await firstValueFrom(
      this.http.patch(`${this.apiUrl}/usuarios/${id}/inactivar`, {}, {
        headers: this.headers(),
      })
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================
  async rolName(id: string): Promise<string> {
    const roles = await this.listRoles();
    return roles.find(r => r.id === id)?.name || '—';
  }

  async permisoName(id: string): Promise<string> {
    const permisos = await this.listPermisos();
    return permisos.find(p => p.id === id)?.name || '—';
  }
}