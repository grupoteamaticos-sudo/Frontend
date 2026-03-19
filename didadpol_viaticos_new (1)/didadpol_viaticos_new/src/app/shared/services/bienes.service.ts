import { Injectable } from '@angular/core';

export type TipoRegistro = 'ALTA' | 'BAJA' | 'AJUSTE';
export type TipoBien =
  | 'EQUIPO'
  | 'MOBILIARIO'
  | 'HERRAMIENTA'
  | 'VEHICULO'
  | 'OTRO';

export interface Bien {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoBien;
  stock: number; // demo (global)
  creadoAt: string;
}

export interface RegistroDetalle {
  bienId: string;
  codigo: string;
  nombre: string;
  tipo: TipoBien;
  cantidad: number;
  nota?: string;
}

export interface RegistroBienes {
  id: string;
  tipoRegistro: TipoRegistro;
  proveedor?: string;
  documento?: string;
  descripcion?: string;
  detalles: RegistroDetalle[];
  creadoAt: string;
  user: string;
}

type CreateRegistroOk = { ok: true; registro: RegistroBienes };
type CreateRegistroErr = { ok: false; message: string };
export type CreateRegistroResult = CreateRegistroOk | CreateRegistroErr;

const LS_BIENES = 'didadpol_bienes';
const LS_REGISTROS = 'didadpol_registro_bienes';

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

@Injectable({ providedIn: 'root' })
export class BienesService {
  // Catálogo simple (podés cambiar nombres, sin afectar diseño)
  listTiposBien(): TipoBien[] {
    return ['EQUIPO', 'MOBILIARIO', 'HERRAMIENTA', 'VEHICULO', 'OTRO'];
  }

  listTiposRegistro(): TipoRegistro[] {
    return ['ALTA', 'BAJA', 'AJUSTE'];
  }

  // --------- BIENES ----------
  listBienes(): Bien[] {
    return this.readJson<Bien[]>(LS_BIENES, []);
  }

  private saveBienes(b: Bien[]) {
    localStorage.setItem(LS_BIENES, JSON.stringify(b));
  }

  upsertBienByCodigo(input: {
    codigo: string;
    nombre: string;
    tipo: TipoBien;
    delta: number;
  }): Bien {
    const bienes = this.listBienes();
    const codigo = (input.codigo ?? '').trim();
    const nombre = (input.nombre ?? '').trim();

    let bien = bienes.find(x => x.codigo.toLowerCase() === codigo.toLowerCase());

    if (!bien) {
      bien = {
        id: uid('bien'),
        codigo,
        nombre,
        tipo: input.tipo,
        stock: 0,
        creadoAt: new Date().toISOString(),
      };
      bienes.unshift(bien);
    } else {
      // si ya existe, actualizamos nombre/tipo si vienen distintos
      if (nombre) bien.nombre = nombre;
      if (input.tipo) bien.tipo = input.tipo;
    }

    bien.stock = Math.max(0, Number(bien.stock || 0) + Number(input.delta || 0));
    this.saveBienes(bienes);
    return bien;
  }

  // --------- REGISTROS ----------
  listRegistros(): RegistroBienes[] {
    return this.readJson<RegistroBienes[]>(LS_REGISTROS, []);
  }

  private saveRegistros(r: RegistroBienes[]) {
    localStorage.setItem(LS_REGISTROS, JSON.stringify(r));
  }

  createRegistro(payload: Omit<RegistroBienes, 'id' | 'creadoAt'>): CreateRegistroResult {
    if (!payload.detalles || payload.detalles.length === 0) {
      return { ok: false, message: 'Agregá al menos un detalle.' };
    }

    // Validación de detalles
    for (const d of payload.detalles) {
      if (!d.codigo?.trim() || !d.nombre?.trim()) {
        return { ok: false, message: 'Completá código y nombre del bien.' };
      }
      if (!d.cantidad || d.cantidad < 1) {
        return { ok: false, message: 'Cantidad inválida.' };
      }
    }

    // aplicar impacto stock (demo global)
    const tipo = payload.tipoRegistro;

    for (const d of payload.detalles) {
      const delta =
        tipo === 'ALTA'
          ? d.cantidad
          : tipo === 'BAJA'
          ? -d.cantidad
          : d.cantidad; // AJUSTE (en demo lo sumamos)

      const bien = this.upsertBienByCodigo({
        codigo: d.codigo,
        nombre: d.nombre,
        tipo: d.tipo,
        delta,
      });

      d.bienId = bien.id;
    }

    const registros = this.listRegistros();

    const nuevo: RegistroBienes = {
      ...payload,
      id: uid('reg'),
      creadoAt: new Date().toISOString(),
    };

    registros.unshift(nuevo);
    this.saveRegistros(registros);

    return { ok: true, registro: nuevo };
  }

  private readJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}