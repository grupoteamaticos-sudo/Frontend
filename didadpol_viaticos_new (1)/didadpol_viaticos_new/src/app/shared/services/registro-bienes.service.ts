import { Injectable } from '@angular/core';
import { AuditService } from './audit.service';

export type TipoRegistro = 'ALTA' | 'INGRESO' | 'BAJA' | 'AJUSTE';

export type RegistroDetalle = {
  itemCode: string;
  itemName: string;
  qty: number;
  costoUnit?: number;
  nota?: string;
};

export type Registro = {
  id: string;
  tipo: TipoRegistro;
  fecha: string; // ISO
  proveedor?: string;
  documento?: string;
  descripcion?: string;
  usuario: string;
  detalles: RegistroDetalle[];
};

@Injectable({ providedIn: 'root' })
export class RegistroBienesService {
  private key = 'registros_bienes_demo';

  constructor(private audit: AuditService) {}

  private isBrowser() {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  list(): Registro[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as Registro[]) : [];
    } catch {
      return [];
    }
  }

  private save(rows: Registro[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.key, JSON.stringify(rows));
  }

  create(input: Omit<Registro, 'id' | 'fecha'> & { fecha?: string }): { ok: boolean; message?: string } {
    if (!input.tipo) return { ok: false, message: 'Seleccioná el tipo de registro.' };
    if (!input.usuario) return { ok: false, message: 'No hay usuario.' };
    if (!input.detalles || input.detalles.length === 0) return { ok: false, message: 'Agregá al menos 1 detalle.' };

    for (const d of input.detalles) {
      if (!d.itemCode?.trim() || !d.itemName?.trim()) return { ok: false, message: 'Detalle inválido (código/nombre).' };
      const q = Number(d.qty);
      if (!Number.isFinite(q) || q <= 0) return { ok: false, message: 'Cantidad debe ser mayor a 0.' };
    }

    const rows = this.list();
    const r: Registro = {
      id: 'REG-' + Date.now(),
      tipo: input.tipo,
      fecha: input.fecha || new Date().toISOString(),
      proveedor: input.proveedor || '',
      documento: input.documento || '',
      descripcion: input.descripcion || '',
      usuario: input.usuario,
      detalles: input.detalles.map(x => ({
        itemCode: String(x.itemCode),
        itemName: String(x.itemName),
        qty: Number(x.qty),
        costoUnit: x.costoUnit != null ? Number(x.costoUnit) : undefined,
        nota: x.nota ? String(x.nota) : '',
      })),
    };

    rows.unshift(r);
    this.save(rows);

    this.audit.add('ACTION', `Registro creado: ${r.tipo} (${r.id})`);
    return { ok: true };
  }

  delete(id: string) {
    const rows = this.list().filter(r => r.id !== id);
    this.save(rows);
    this.audit.add('DELETE', `Registro eliminado: ${id}`);
  }
}