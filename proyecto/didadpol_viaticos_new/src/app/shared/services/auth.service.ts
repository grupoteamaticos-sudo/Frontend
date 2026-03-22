import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export type AppRole = 'ADMIN' | 'OPERADOR' | string;

export interface AppUser {
  id: string;
  username: string;
  role: AppRole;
  activo: boolean;
  email?: string;
  roles?: string[];
  permisos?: string[];
}

type LoginStep1Ok = {
  ok: true;
  requires2FA: boolean;
  tempToken: string;
  channel?: string;
  devOtp?: string;
};

type LoginErr = { ok: false; message: string };

type Verify2FAOk = {
  ok: true;
};

export type LoginStep1Result = LoginStep1Ok | LoginErr;
export type Verify2FAResult = Verify2FAOk | LoginErr;

const LS_SESSION = 'didadpol_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private readJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveJson(key: string, val: any) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  getUser(): AppUser | null {
    if (!this.isBrowser()) return null;
    const s = this.readJson<any>(LS_SESSION, null);
    return s?.user || null;
  }

  getAccessToken(): string | null {
    if (!this.isBrowser()) return null;
    const s = this.readJson<any>(LS_SESSION, null);
    return s?.accessToken || null;
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  logout() {
    if (!this.isBrowser()) return;
    localStorage.removeItem(LS_SESSION);
    this.router.navigateByUrl('/login');
  }

  async loginStep1(username: string, password: string): Promise<LoginStep1Result> {
    try {
      const body = {
        username: username.trim(),
        password: password.trim(),
      };

      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/login`, body)
      );

      if (!res?.ok) {
        return { ok: false, message: res?.message || 'Credenciales inválidas.' };
      }

      return {
        ok: true,
        requires2FA: !!res.requires2FA,
        tempToken: res.tempToken,
        channel: res.channel || 'APP',
        devOtp: res.devOtp
      };
    } catch (error: any) {
      return {
        ok: false,
        message:
          error?.error?.message ||
          error?.error?.msg ||
          'No se pudo iniciar sesión.'
      };
    }
  }

  async verify2FA(tempToken: string, code: string): Promise<Verify2FAResult> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/verify-otp`, {
          tempToken,
          code: code.trim()
        })
      );

      if (!res?.ok) {
        return { ok: false, message: res?.message || 'Código inválido.' };
      }

      const data = res.data || {};
      const accessToken = data.accessToken || '';
      const refreshToken = data.refreshToken || '';
      const rawUser = data.usuario || {};
      const roles = Array.isArray(data.roles) ? data.roles : [];
      const permisos = Array.isArray(data.permisos) ? data.permisos : [];

      const mappedUser: AppUser = {
        id: String(rawUser.id || rawUser.id_usuario || ''),
        username: String(rawUser.username || rawUser.nombre_usuario || ''),
        role: String(roles[0]?.nombre_rol || 'OPERADOR'),
        activo: true,
        email: rawUser.correo_login || '',
        roles: roles.map((r: any) => String(r.nombre_rol || r)),
        permisos: permisos.map((p: any) => String(p.codigo_permiso || p)),
      };

      this.saveJson(LS_SESSION, {
        accessToken,
        refreshToken,
        user: mappedUser
      });

      return { ok: true };
    } catch (error: any) {
      return {
        ok: false,
        message:
          error?.error?.message ||
          error?.error?.msg ||
          'No se pudo verificar el código.'
      };
    }
  }

  async forgotPasswordStart(identifier: string): Promise<any> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/forgot-password`, {
          identifier: identifier.trim()
        })
      );

      return res;
    } catch (error: any) {
      return {
        ok: false,
        message:
          error?.error?.message ||
          error?.error?.msg ||
          'No se pudo iniciar la recuperación.'
      };
    }
  }

  async forgotPasswordComplete(payload: {
    tempToken: string;
    code: string;
    newPassword: string;
    passwordConfirm: string;
  }): Promise<any> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/recover-password`, payload)
      );

      return res;
    } catch (error: any) {
      return {
        ok: false,
        message:
          error?.error?.message ||
          error?.error?.msg ||
          'No se pudo restablecer la contraseña.'
      };
    }
  }
}