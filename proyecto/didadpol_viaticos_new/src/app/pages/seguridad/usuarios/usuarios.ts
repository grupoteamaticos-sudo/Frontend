import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

import { SeguridadService, Usuario, Rol } from '../../../shared/services/seguridad.service';
import { AuditService } from '../../../shared/services/audit.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-seg-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class SegUsuarios implements OnInit {
  usuarios: Usuario[] = [];
  rolesCatalogo: Rol[] = [];
  empleados: any[] = []; // Declaración necesaria para evitar el error de la imagen a83e5d

  msg = '';
  err = '';
  loading = false;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private seg: SeguridadService,
    private audit: AuditService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      idEmpleado: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      activo: [true],
      roles: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    this.msg = '';
    this.err = '';

    try {
      // Cargamos los 3 datos en paralelo desde tu SeguridadService
      const [u, r, e] = await Promise.all([
        this.seg.listUsuarios(),
        this.seg.listRoles(),
        this.seg.listEmpleadosDisponibles()
      ]);

      this.usuarios = u;
      this.rolesCatalogo = r;
      this.empleados = e;
    } catch (e: any) {
      this.err = 'No se pudo cargar la información de seguridad.';
    } finally {
      this.loading = false;
    }
  }

  async submit() {
    this.msg = '';
    this.err = '';

    if (this.form.invalid) {
      this.err = 'Completá los campos requeridos.';
      return;
    }

    try {
      const v = this.form.value;

      await this.seg.createUsuario({
        idEmpleado: String(v.idEmpleado || ''),
        username: String(v.username || ''),
        email: String(v.email || ''),
        password: String(v.password || ''),
        activo: !!v.activo,
        roleId: String(v.roles || ''),
      });

      // Registro en auditoría
      const me = this.auth.getUser()?.username || 'admin';
      this.audit.log({
        user: me,
        type: 'CREATE',
        module: 'Seguridad/Usuarios',
        detail: `Creó usuario: ${v.username}`,
      });

      this.msg = 'Usuario creado ✅';
      this.form.reset({ activo: true, idEmpleado: '', roles: '' });
      await this.loadAll();
    } catch (e: any) {
      this.err = e?.error?.message || 'No se pudo crear el usuario.';
    }
  }

  async toggle(u: Usuario) {
    this.msg = '';
    this.err = '';

    try {
      await this.seg.toggleActivo(u.id);
      
      const me = this.auth.getUser()?.username || 'admin';
      this.audit.log({
        user: me,
        type: 'UPDATE',
        module: 'Seguridad/Usuarios',
        detail: `Cambió bloqueo de ${u.username}`,
      });

      await this.loadAll();
    } catch (e: any) {
      this.err = 'No se pudo cambiar el estado.';
    }
  }

  async delete(u: Usuario) {
    if(!confirm('¿Desea inactivar este usuario?')) return;
    this.msg = '';
    this.err = '';

    try {
      await this.seg.deleteUsuario(u.id);

      const me = this.auth.getUser()?.username || 'admin';
      this.audit.log({
        user: me,
        type: 'DELETE',
        module: 'Seguridad/Usuarios',
        detail: `Inactivó usuario: ${u.username}`,
      });

      this.msg = 'Usuario inactivado ✅';
      await this.loadAll();
    } catch (e: any) {
      this.err = 'No se pudo inactivar el usuario.';
    }
  }

  rolName(id: string) {
    return this.rolesCatalogo.find(r => r.id === id)?.name || '—';
  }

  roles() {
    return this.rolesCatalogo;
  }
}