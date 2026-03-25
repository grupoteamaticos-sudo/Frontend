import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Permiso {
  id: string;
  name: string;
  code: string;
  descripcion?: string;
}

export interface Rol {
  id: string;
  name: string;
  description?: string;
  activo?: boolean;
  permisos: string[];
}

export interface Usuario {
  id: string;
  idEmpleado: string;
  username: string;
  email: string;
  activo: boolean;
  bloqueado: boolean;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class SeguridadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken() || '';
    return new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async listPermisos(): Promise<Permiso[]> {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/permisos`, { headers: this.getHeaders() }));
    const data = res?.data || res || [];
    return data.map((p: any) => ({
      id: String(p.id_permiso),
      name: p.nombre_permiso,
      code: p.nombre_permiso,
      descripcion: p.descripcion_permiso
    }));
  }

  async createPermiso(p: any) {
    return await firstValueFrom(this.http.post(`${this.apiUrl}/permisos`, {
      nombre_permiso: p.name || p.nombre,
      descripcion_permiso: p.descripcion || ''
    }, { headers: this.getHeaders() }));
  }

  async deletePermiso(id: string) {
    return await firstValueFrom(this.http.delete(`${this.apiUrl}/permisos/${id}`, { headers: this.getHeaders() }));
  }

  async listRoles(): Promise<Rol[]> {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/roles`, { headers: this.getHeaders() }));
    const data = res?.roles || res?.data || (Array.isArray(res) ? res : []);
    return data.map((r: any) => ({
      id: String(r.id_rol),
      name: String(r.nombre_rol || ''),
      description: String(r.descripcion_rol || ''),
      activo: String(r.estado_rol).toUpperCase() === 'ACTIVO',
      permisos: Array.isArray(r.permisos) ? r.permisos.map((p: any) => String(p.id_permiso || p)) : [],
    }));
  }

  async createRol(nombre: string) {
    return await firstValueFrom(this.http.post(`${this.apiUrl}/roles`, { nombre_rol: nombre }, { headers: this.getHeaders() }));
  }

  async deleteRol(id: string) {
    return await firstValueFrom(this.http.delete(`${this.apiUrl}/roles/${id}`, { headers: this.getHeaders() }));
  }

  async addPermisoToRol(rolId: string, permId: string) {
    return await firstValueFrom(this.http.post(`${this.apiUrl}/roles/${rolId}/permisos`, { id_permiso: permId }, { headers: this.getHeaders() }));
  }

  async removePermisoFromRol(rolId: string, permId: string) {
    return await firstValueFrom(this.http.delete(`${this.apiUrl}/roles/${rolId}/permisos/${permId}`, { headers: this.getHeaders() }));
  }

  async listUsuarios(): Promise<Usuario[]> {
    const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() }));
    const data = res?.data || (Array.isArray(res) ? res : []);
    return data.map((u: any) => ({
      id: String(u.id_usuario),
      idEmpleado: String(u.id_empleado ?? ''),
      username: String(u.nombre_usuario || ''),
      email: String(u.correo_login || ''),
      activo: String(u.estado_usuario).toUpperCase() === 'ACTIVO',
      bloqueado: !!u.bloqueado,
      roles: Array.isArray(u.roles) ? u.roles.map((r: any) => String(r.id_rol || r)) : [],
    }));
  }

  async createUsuario(u: any) {
    const payload = {
      id_empleado: Number(u.idEmpleado),
      nombre_usuario: u.username.trim(),
      password: u.password,
      correo_login: u.email.trim(),
      id_rol: Number(u.roles),
      activo: true,
    };
    return await firstValueFrom(this.http.post(`${this.apiUrl}/usuarios`, payload, { headers: this.getHeaders() }));
  }

  async listEmpleadosDisponibles(): Promise<any[]> {
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/empleados/disponibles`, { headers: this.getHeaders() }));
      return res?.data || res || [];
    } catch (e) { return []; }
  }

  async toggleActivo(id: string) {
    return await firstValueFrom(this.http.patch(`${this.apiUrl}/usuarios/${id}/bloqueo`, {}, { headers: this.getHeaders() }));
  }

  async deleteUsuario(id: string) {
    return await firstValueFrom(this.http.patch(`${this.apiUrl}/usuarios/${id}/inactivar`, {}, { headers: this.getHeaders() }));
  }
}