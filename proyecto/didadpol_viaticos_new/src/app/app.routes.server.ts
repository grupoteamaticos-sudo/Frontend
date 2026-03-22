import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Esto le dice al SSR que cualquier ruta se renderice en servidor
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];