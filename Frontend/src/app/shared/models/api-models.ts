// src/app/shared/models/api-models.ts

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ProdutoListItemDto {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  estoque: number;
  Ativo?: boolean;
}

export interface ListProdutosQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  orderBy?: string;
  sortDirection?: 'asc' | 'desc';
  Ativo?: boolean;
  skipIsActiveDefault?: boolean;
}

export type PedidoStatus = 'CRIADO' | 'PAGO' | 'CANCELADO';

export interface PedidoListItemDto {
  id: string;
  pessoaNome: string;
  dataCriacao: string;
  status: PedidoStatus;
  valorTotalPedido: number;
}

export interface PedidoDetailsItemDto {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  valorTotalUnitario: number;
}

export interface PedidoDetailsDto {
  id: string;
  pessoaId: string;
  pessoaNome: string;
  pessoaCpfCnpj: string;
  valorTotalPedido: number;
  status: PedidoStatus;
  dataCriacao: string;
  items: PedidoDetailsItemDto[];
}

export interface CreatePedidoItemRequest {
  produtoId: string;
  quantidade: number;
}

export interface CreatePedidoRequest {
  pessoaId: string;
  items: CreatePedidoItemRequest[];
}

export { ApiResponse } from './api-response.interface';
