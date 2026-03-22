import { Injectable } from '@angular/core';

export interface AuditEvent {
  id: string;
  at: string;        // ISO date
  user: string;      // username
  type: string;      // CREATE / UPDATE / DELETE / LOGIN / LOGOUT / etc
  module: string;    // "Seguridad/Usuarios", etc

  // ✅ compat: tu bitacora.html usa message
  message?: string;

  // ✅ también lo dejamos por si otras pantallas usan detail
  detail?: string;
}

const LS_AUDIT = 'audit';

@Injectable({ providedIn: 'root' })
export class AuditService {
  list(): AuditEvent[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LS_AUDIT);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as AuditEvent[];
    } catch {
      return [];
    }
  }

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LS_AUDIT);
  }

  /** Forma “completa” */
  log(ev: Omit<AuditEvent, 'id' | 'at'> & Partial<Pick<AuditEvent, 'id' | 'at'>>) {
    const msg = ev.message ?? ev.detail ?? '';

    const full: AuditEvent = {
      id: ev.id ?? cryptoRandomId(),
      at: ev.at ?? new Date().toISOString(),
      user: ev.user,
      type: ev.type,
      module: ev.module,
      // ✅ guardamos ambos para compatibilidad total
      message: msg,
      detail: msg,
    };

    const arr = this.list();
    arr.unshift(full);
    this.save(arr);
  }

  /** Forma “rápida”: add('LOGOUT', '...', 'UserMenu') */
  add(type: string, message = '', module = 'General', user = 'system') {
    this.log({ user, type, module, message });
  }

  private save(arr: AuditEvent[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_AUDIT, JSON.stringify(arr.slice(0, 500)));
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}