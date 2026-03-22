import { Injectable } from '@angular/core';

export type MovType = 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'AJUSTE';

export type Item = {
  id: string;
  code: string;
  name: string;
  unit?: string;
  active?: boolean;
};

export type Warehouse = {
  id: string;
  name: string;
  active?: boolean;
};

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private KEY_WAREHOUSES = 'inv_warehouses';
  private KEY_STOCK = 'inv_stock_by_wh'; // { [warehouseId]: { [itemId]: number } }

  // ✅ MISMA FUENTE de "Registro de Bienes"
  private KEY_BIENES = 'bienes'; // array de bienes/items

  // ---------- BODEGAS ----------
  listWarehouses(): Warehouse[] {
    const raw = localStorage.getItem(this.KEY_WAREHOUSES);
    const parsed: Warehouse[] = raw ? JSON.parse(raw) : [];

    // seed básico si no hay bodegas
    if (!parsed.length) {
      const seed: Warehouse[] = [
        { id: 'BOD-TGU', name: 'Bodega Tegucigalpa', active: true },
        { id: 'BOD-SPS', name: 'Bodega San Pedro Sula', active: true },
      ];
      localStorage.setItem(this.KEY_WAREHOUSES, JSON.stringify(seed));
      this.ensureStockShape(seed.map(s => s.id));
      return seed;
    }

    this.ensureStockShape(parsed.map(s => s.id));
    return parsed;
  }

  // ---------- BIENES/ITEMS ----------
  listItems(): Item[] {
    // ✅ Se conecta con Registro de Bienes
    const raw = localStorage.getItem(this.KEY_BIENES);
    const bienes = raw ? JSON.parse(raw) : [];

    // Mapeo flexible: por si tu registro guarda con otros nombres
    const items: Item[] = (bienes || []).map((b: any) => ({
      id: String(b.id ?? b.id_bien ?? b.codigo ?? crypto.randomUUID()),
      code: String(b.code ?? b.codigo ?? b.num_inventario ?? 'SIN-COD'),
      name: String(b.name ?? b.nombre ?? b.nombre_bien ?? 'Sin nombre'),
      unit: String(b.unit ?? b.unidad_medida ?? ''),
      active: b.active ?? true,
    }));

    return items.filter(i => i.active !== false);
  }

  // ---------- STOCK ----------
  getStock(warehouseId: string, itemId: string): number {
    const stock = this.readStock();
    return Number(stock?.[warehouseId]?.[itemId] ?? 0);
  }

  setStock(warehouseId: string, itemId: string, qty: number) {
    const stock = this.readStock();
    stock[warehouseId] = stock[warehouseId] || {};
    stock[warehouseId][itemId] = Number(qty || 0);
    this.writeStock(stock);
  }

  addStock(warehouseId: string, itemId: string, delta: number) {
    const current = this.getStock(warehouseId, itemId);
    this.setStock(warehouseId, itemId, current + Number(delta || 0));
  }

  // Asegura estructura para bodegas nuevas
  private ensureStockShape(warehouseIds: string[]) {
    const stock = this.readStock();
    let changed = false;

    for (const wid of warehouseIds) {
      if (!stock[wid]) {
        stock[wid] = {};
        changed = true;
      }
    }

    if (changed) this.writeStock(stock);
  }

  private readStock(): Record<string, Record<string, number>> {
    const raw = localStorage.getItem(this.KEY_STOCK);
    return raw ? JSON.parse(raw) : {};
  }

  private writeStock(stock: Record<string, Record<string, number>>) {
    localStorage.setItem(this.KEY_STOCK, JSON.stringify(stock));
  }
}