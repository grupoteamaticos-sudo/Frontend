import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private K = 'roles';

  constructor(private store: StorageService) {}

  list(): Role[] {
    const roles = this.store.get<Role[]>(this.K, []);
    if (roles.length) return roles;

    const seed: Role[] = [
      { id: 'r-admin', name: 'ADMIN', permissions: ['*'] },
      { id: 'r-oper', name: 'OPERADOR', permissions: ['BIENES_VER', 'RESERVAS_VER'] },
    ];
    this.store.set(this.K, seed);
    return seed;
  }

  private save(roles: Role[]) {
    this.store.set(this.K, roles);
  }

  create(name: string): { ok: boolean; message?: string } {
    const roles = this.list();
    const n = (name || '').trim();
    if (!n) return { ok: false, message: 'Nombre de rol requerido.' };
    if (roles.some(r => r.name.toLowerCase() === n.toLowerCase())) {
      return { ok: false, message: 'Ese rol ya existe.' };
    }

    roles.unshift({ id: cryptoRandomId(), name: n, permissions: [] });
    this.save(roles);
    return { ok: true };
  }

  setPermissions(roleId: string, permissions: string[]) {
    const roles = this.list();
    const r = roles.find(x => x.id === roleId);
    if (!r) return;
    r.permissions = [...new Set(permissions)];
    this.save(roles);
  }

  remove(roleId: string) {
    const roles = this.list().filter(r => r.id !== roleId);
    this.save(roles);
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}