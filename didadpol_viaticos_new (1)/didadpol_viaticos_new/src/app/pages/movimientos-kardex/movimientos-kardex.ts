import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InventoryService, Warehouse, Item } from '../../shared/services/inventory.service';

type MovType = 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'AJUSTE';

export type KardexRow = {
  id: string;
  date: string;              // ISO o string
  type: MovType;
  itemId: string;
  qty: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  note?: string;
  user?: string;
};

@Component({
  selector: 'app-movimientos-kardex',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos-kardex.html',
  styleUrl: './movimientos-kardex.scss',
})
export class MovimientosKardex {
  warehouses: Warehouse[] = [];
  items: Item[] = [];
  kardex: KardexRow[] = [];

  // filtros
  fText = '';
  fType: MovType | 'TODOS' = 'TODOS';
  fWarehouseId = 'TODOS';

  msg = '';
  err = '';

  constructor(private inv: InventoryService) {
    this.refresh();
  }

  refresh() {
    this.msg = '';
    this.err = '';

    this.warehouses = this.inv.listWarehouses();
    this.items = this.inv.listItems();
    this.kardex = this.loadKardex();

    // Si está vacío, no es error: es que aún no hay procesos que generen kardex
  }

  // ✅ Lee del storage (lo llenaremos desde Asignación / Traslados / etc.)
  private loadKardex(): KardexRow[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('kardex');
      const arr = raw ? (JSON.parse(raw) as KardexRow[]) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  // Helpers
  itemName(id: string) {
    return this.items.find(i => i.id === id)?.name || '—';
  }

  itemCode(id: string) {
    return this.items.find(i => i.id === id)?.code || '—';
  }

  warehouseName(id?: string) {
    if (!id) return '—';
    return this.warehouses.find(w => w.id === id)?.name || '—';
  }

  // ---------- filtros ----------
  filtered(): KardexRow[] {
    const txt = this.fText.trim().toLowerCase();

    return this.kardex.filter(k => {
      if (this.fType !== 'TODOS' && k.type !== this.fType) return false;

      if (this.fWarehouseId !== 'TODOS') {
        const wid = this.fWarehouseId;
        const match =
          k.fromWarehouseId === wid ||
          k.toWarehouseId === wid;
        if (!match) return false;
      }

      if (txt) {
        const hay = `${k.id} ${k.type} ${this.itemCode(k.itemId)} ${this.itemName(k.itemId)} ${k.note || ''} ${k.user || ''}`.toLowerCase();
        if (!hay.includes(txt)) return false;
      }

      return true;
    });
  }
}