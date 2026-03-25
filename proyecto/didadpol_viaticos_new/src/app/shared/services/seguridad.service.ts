import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// Definición de interfaces para evitar errores de tipo 'any'
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

  // Centralizamos las cabeceras para reutilizarlas
  private getHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken() || '';
    return new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // 1. Lista de empleados disponibles
  async listEmpleadosDisponibles(): Promise<any[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/empleados/disponibles`, { headers: this.getHeaders() })
      );
      // Ajuste según estructura: res.data suele ser el estándar en tus otros métodos
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (e) {
      console.error('Error al obtener empleados disponibles:', e);
      return [];
    }
  }

  // 2. Listar Roles (Mapeo corregido según tu captura de pantalla)
  async listRoles(): Promise<Rol[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/roles`, { headers: this.getHeaders() })
      );
      
      // Verificamos si los datos vienen en res.roles o res.data
      const rawData = res?.roles || res?.data || (Array.isArray(res) ? res : []);
      
      return rawData.map((r: any) => ({
        id: String(r.id_rol),
        name: String(r.nombre_rol || ''),
        description: String(r.descripcion_rol || ''),
        activo: String(r.estado_rol).toUpperCase() === 'ACTIVO',
        permisos: Array.isArray(r.permisos) ? r.permisos.map((p: any) => String(p.id_permiso || p)) : [],
      }));
    } catch (e) {
      console.error('Error al listar roles:', e);
      return [];
    }
  }

  // 3. Listar Usuarios
  async listUsuarios(): Promise<Usuario[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() })
      );
      
      const rawData = res?.data || (Array.isArray(res) ? res : []);
      
      return rawData.map((u: any) => ({
        id: String(u.id_usuario),
        idEmpleado: String(u.id_empleado ?? ''),
        username: String(u.nombre_usuario || ''),
        email: String(u.correo_login || ''),
        activo: String(u.estado_usuario).toUpperCase() === 'ACTIVO',
        bloqueado: !!u.bloqueado || u.estado_usuario === 'BLOQUEADO',
        roles: Array.isArray(u.roles) ? u.roles.map((r: any) => String(r.id_rol || r)) : [],
      }));
    } catch (e) {
      console.error('Error al listar usuarios:', e);
      return [];
    }
  }

  // 4. Crear Usuario (Nombres de campos según tu DB)
  async createUsuario(u: any) {
    const payload = {
      id_empleado: Number(u.idEmpleado),
      nombre_usuario: u.username.trim(),
      password: u.password,
      correo_login: u.email.trim(),
      id_rol: Number(u.roleId),
      activo: u.activo !== undefined ? !!u.activo : true,
    };
    return await firstValueFrom(
      this.http.post(`${this.apiUrl}/usuarios`, payload, { headers: this.getHeaders() })
    );
  }

  // 5. Gestión de estado (Bloqueo e Inactivación)
  async toggleActivo(id: string) {
    return await firstValueFrom(
      this.http.patch(`${this.apiUrl}/usuarios/${id}/bloqueo`, {}, { headers: this.getHeaders() })
    );
  }

  async deleteUsuario(id: string) {
    return await firstValueFrom(
      this.http.patch(`${this.apiUrl}/usuarios/${id}/inactivar`, {}, { headers: this.getHeaders() })
    );
  }
}