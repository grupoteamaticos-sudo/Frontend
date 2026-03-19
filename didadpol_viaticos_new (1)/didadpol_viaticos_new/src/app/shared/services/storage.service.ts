import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private prefix = 'did_'; // ✅ prefijo para NO pisar nada

  private key(k: string) {
    return this.prefix + k;
  }

  get<T>(k: string, fallback: T): T {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(this.key(k));
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(k: string, value: T): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.setItem(this.key(k), JSON.stringify(value));
  }

  remove(k: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.key(k));
  }
}