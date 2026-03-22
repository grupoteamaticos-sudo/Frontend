import { Injectable } from '@angular/core';
import { InventoryService } from './inventory.service';

export type ReservaEstado = 'PENDIENTE' | 'APROBADA' | 'ENTREGADA' | 'CANCELADA';

export type Reserva = {
  id: string;
  createdAt: string;

  warehouseId: string;
  itemId: string;
  qty: number;

  solicitante: string;
  motivo: string;

  estado: ReservaEstado;
  aprobadoPor?: string;
  aprobadoAt?: string;

  entregadoPor?: string;
  entregadoAt?: string;

  cancelReason?: string;
  cancelAt?: string;
};

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private KEY = 'reservas';

  constructor(private inv: InventoryService) {}

  list(): Reserva[] {
    const raw = localStorage.getItem(this.KEY);
    const data: Reserva[] = raw ? JSON.parse(raw) : [];
    // más nuevas arriba
    return data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  create(input: {
    warehouseId: string;
    itemId: string;
    qty: number;
    solicitante: string;
    motivo: string;
  }): { ok: boolean; message: string; data?: Reserva } {
    const qty = Number(input.qty || 0);
    if (!input.warehouseId || !input.itemId) return { ok: false, message: 'Seleccioná bodega y bien.' };
    if (!qty || qty <= 0) return { ok: false, message: 'La cantidad debe ser mayor a 0.' };
    if (!input.solicitante.trim()) return { ok: false, message: 'Ingresá el solicitante.' };
    if (!input.motivo.trim()) return { ok: false, message: 'Ingresá el motivo.' };

    // ✅ valida contra stock actual
    const stock = this.inv.getStock(input.warehouseId, input.itemId);
    if (qty > stock) return { ok: false, message: `Stock insuficiente. Disponible: ${stock}` };

    const r: Reserva = {
      id: `RES-${Date.now()}`,
      createdAt: new Date().toISOString(),
      warehouseId: input.warehouseId,
      itemId: input.itemId,
      qty,
      solicitante: input.solicitante.trim(),
      motivo: input.motivo.trim(),
      estado: 'PENDIENTE',
    };

    const all = this.listRaw();
    all.push(r);
    this.save(all);

    return { ok: true, message: 'OK', data: r };
  }

  aprobar(id: string, user: string): { ok: boolean; message: string } {
    const all = this.listRaw();
    const r = all.find(x => x.id === id);
    if (!r) return { ok: false, message: 'Reserva no encontrada.' };
    if (r.estado !== 'PENDIENTE') return { ok: false, message: 'Solo se pueden aprobar reservas PENDIENTE.' };

    // valida stock al aprobar también (por si cambió)
    const stock = this.inv.getStock(r.warehouseId, r.itemId);
    if (r.qty > stock) return { ok: false, message: `Stock insuficiente para aprobar. Disponible: ${stock}` };

    r.estado = 'APROBADA';
    r.aprobadoPor = user;
    r.aprobadoAt = new Date().toISOString();

    this.save(all);
    return { ok: true, message: 'OK' };
  }

  cancelar(id: string, reason: string): { ok: boolean; message: string } {
    const all = this.listRaw();
    const r = all.find(x => x.id === id);
    if (!r) return { ok: false, message: 'Reserva no encontrada.' };
    if (r.estado === 'ENTREGADA') return { ok: false, message: 'No se puede cancelar una reserva ENTREGADA.' };

    r.estado = 'CANCELADA';
    r.cancelReason = reason || 'Cancelada';
    r.cancelAt = new Date().toISOString();

    this.save(all);
    return { ok: true, message: 'OK' };
  }

  entregar(id: string, user: string): { ok: boolean; message: string } {
    const all = this.listRaw();
    const r = all.find(x => x.id === id);
    if (!r) return { ok: false, message: 'Reserva no encontrada.' };
    if (r.estado !== 'APROBADA') return { ok: false, message: 'Solo se puede entregar una reserva APROBADA.' };

    // ✅ al entregar, descuenta stock
    const stock = this.inv.getStock(r.warehouseId, r.itemId);
    if (r.qty > stock) return { ok: false, message: `Stock insuficiente. Disponible: ${stock}` };

    this.inv.addStock(r.warehouseId, r.itemId, -r.qty);

    r.estado = 'ENTREGADA';
    r.entregadoPor = user;
    r.entregadoAt = new Date().toISOString();

    this.save(all);
    return { ok: true, message: 'OK' };
  }

  // ---------- helpers ----------
  private listRaw(): Reserva[] {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private save(all: Reserva[]) {
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }
}