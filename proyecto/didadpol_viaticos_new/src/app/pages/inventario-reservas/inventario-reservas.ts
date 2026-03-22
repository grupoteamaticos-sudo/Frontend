import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ para [(ngModel)]
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { InventoryService, Item, Warehouse } from '../../shared/services/inventory.service';
import { ReservasService, Reserva, ReservaEstado } from '../../shared/services/reservas.service';

@Component({
  selector: 'app-inventario-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventario-reservas.html',
  styleUrl: './inventario-reservas.scss',
})
export class InventarioReservas {
  warehouses: Warehouse[] = [];
  items: Item[] = [];
  reservas: Reserva[] = [];

  msg = '';
  err = '';

  // filtros
  fText = '';
  fEstado: ReservaEstado | 'TODOS' = 'TODOS';
  fWarehouseId = 'TODOS';

  // ✅ IMPORTANTE: no usar this.fb aquí arriba
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    public inv: InventoryService,
    private res: ReservasService
  ) {
    // ✅ Crear form aquí (fb ya existe)
    this.form = this.fb.group({
      warehouseId: ['', Validators.required],
      itemId: ['', Validators.required],
      qty: [1, [Validators.required]],
      solicitante: ['', Validators.required],
      motivo: ['', Validators.required],
    });

    this.refresh();
  }

  refresh() {
    this.warehouses = this.inv.listWarehouses();
    this.items = this.inv.listItems();
    this.reservas = this.res.list();
  }

  // helpers seguros (sin String(...) en template)
  selectedWarehouseId(): string {
    return (this.form.value.warehouseId || '') as string;
  }

  selectedItemId(): string {
    return (this.form.value.itemId || '') as string;
  }

  stock(warehouseId: string, itemId: string) {
    return this.inv.getStock(warehouseId, itemId);
  }

  itemName(id: string) {
    return this.items.find(i => i.id === id)?.name || '—';
  }

  itemCode(id: string) {
    return this.items.find(i => i.id === id)?.code || '—';
  }

  warehouseName(id: string) {
    return this.warehouses.find(w => w.id === id)?.name || '—';
  }

  // ---------- acciones ----------
  submit() {
    this.msg = '';
    this.err = '';

    if (this.form.invalid) {
      this.err = 'Completá los campos requeridos.';
      return;
    }

    const v = this.form.value;

    const out = this.res.create({
      warehouseId: (v.warehouseId || '') as string,
      itemId: (v.itemId || '') as string,
      qty: Number(v.qty || 0),
      solicitante: String(v.solicitante || ''),
      motivo: String(v.motivo || ''),
    });

    if (!out.ok) {
      this.err = out.message;
      return;
    }

    this.msg = 'Reserva creada ✅';
    this.form.patchValue({ qty: 1, motivo: '' });
    this.refresh();
  }

  aprobar(r: Reserva) {
    this.msg = '';
    this.err = '';
    const out = this.res.aprobar(r.id, 'admin');
    if (!out.ok) this.err = out.message;
    else this.msg = 'Reserva aprobada ✅';
    this.refresh();
  }

  cancelar(r: Reserva) {
    this.msg = '';
    this.err = '';
    const out = this.res.cancelar(r.id, 'Cancelada por usuario');
    if (!out.ok) this.err = out.message;
    else this.msg = 'Reserva cancelada ✅';
    this.refresh();
  }

  entregar(r: Reserva) {
    this.msg = '';
    this.err = '';
    const out = this.res.entregar(r.id, 'admin');
    if (!out.ok) this.err = out.message;
    else this.msg = 'Reserva entregada ✅ (stock actualizado)';
    this.refresh();
  }

  // ---------- filtros ----------
  filtered(): Reserva[] {
    const txt = this.fText.trim().toLowerCase();

    return this.reservas.filter(r => {
      if (this.fEstado !== 'TODOS' && r.estado !== this.fEstado) return false;
      if (this.fWarehouseId !== 'TODOS' && r.warehouseId !== this.fWarehouseId) return false;

      if (txt) {
        const hay = `${r.id} ${this.itemCode(r.itemId)} ${this.itemName(r.itemId)} ${r.solicitante} ${r.motivo}`.toLowerCase();
        if (!hay.includes(txt)) return false;
      }
      return true;
    });
  }

  badgeClass(estado: ReservaEstado): string {
    const map: Record<ReservaEstado, string> = {
      PENDIENTE: 'b--pendiente',
      APROBADA: 'b--aprobada',
      ENTREGADA: 'b--entregada',
      CANCELADA: 'b--cancelada',
    };
    return map[estado];
  }

  canAprobar(r: Reserva) {
    return r.estado === 'PENDIENTE';
  }

  canEntregar(r: Reserva) {
    return r.estado === 'APROBADA';
  }

  canCancelar(r: Reserva) {
    return r.estado === 'PENDIENTE' || r.estado === 'APROBADA';
  }
}