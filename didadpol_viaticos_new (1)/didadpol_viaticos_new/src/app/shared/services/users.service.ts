import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { AppRole } from './auth.service';

export interface SysUser {
  id: string;
  username: string;
  role: AppRole;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private K = 'users';

  constructor(private store: StorageService) {}

  list(): SysUser[] {
    const users = this.store.get<SysUser[]>(this.K, []);
    if (users.length) return users;

    // Seed demo
    const seed: SysUser[] = [
      { id: 'u-admin', username: 'admin', role: 'ADMIN', activo: true },
      { id: 'u-oper', username: 'operador', role: 'OPERADOR', activo: true },
    ];
    this.store.set(this.K, seed);
    return seed;
  }

  private save(users: SysUser[]) {
    this.store.set(this.K, users);
  }

  create(username: string, role: AppRole): { ok: boolean; message?: string } {
    const users = this.list();
    const u = (username || '').trim();
    if (!u) return { ok: false, message: 'Usuario requerido.' };

    if (users.some(x => x.username.toLowerCase() === u.toLowerCase())) {
      return { ok: false, message: 'Ese usuario ya existe.' };
    }

    users.unshift({
      id: cryptoRandomId(),
      username: u,
      role,
      activo: true,
    });

    this.save(users);
    return { ok: true };
  }

  toggle(id: string) {
    const users = this.list();
    const u = users.find(x => x.id === id);
    if (!u) return;
    u.activo = !u.activo;
    this.save(users);
  }

  remove(id: string) {
    const users = this.list().filter(x => x.id !== id);
    this.save(users);
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}