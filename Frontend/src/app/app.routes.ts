import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'produtos',
    pathMatch: 'full'
  },
  {
    path: 'produtos',
    loadComponent: () => import('./features/produtos/components/produto-crud-container/produto-crud-container.component')
      .then(m => m.ProdutoCrudContainerComponent)
  },
  {
    path: 'pessoas',
    loadComponent: () => import('./features/pessoas/components/pessoa-crud-container.component')
      .then(m => m.PessoaCrudContainerComponent)
  },
  {
    path: 'pedidos/new',
    loadComponent: () => import('./features/pedidos/components/pedido-create-container/pedido-create-container.component')
      .then(m => m.PedidoCreateContainerComponent)
  },
  {
    path: 'pedidos/:id',
    loadComponent: () => import('./features/pedidos/containers/pedido-details/pedido-details-container.component')
      .then(m => m.PedidoDetailsContainerComponent)
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./features/pedidos/containers/pedido-list/pedido-list-container.component')
      .then(m => m.PedidoListContainerComponent)
  }
];
