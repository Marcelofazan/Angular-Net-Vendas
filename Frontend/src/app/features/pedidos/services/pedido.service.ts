// src/app/features/pedidos/services/pedido.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PagedResult, ApiResponse, PedidoListItemDto, CreatePedidoRequest, PedidoStatus, PedidoDetailsDto } from '../../../shared/models/api-models';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = '/api/pedidos';

  constructor(private http: HttpClient) {}

  listPedidos(
    pageNumber: number, 
    pageSize: number, 
    pessoaNome: string | null, 
    status: PedidoStatus | null
  ): Observable<PagedResult<PedidoListItemDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (pessoaNome) {
      params = params.set('pessoaNome', pessoaNome);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PagedResult<PedidoListItemDto>>>(this.apiUrl, { params }).pipe(
      map(response => {
        if (response.data) {
          return response.data;
        }
        throw new Error('Formato de resposta inválido.');
      })
    );
  }

  createPedido(command: CreatePedidoRequest, idempotencyKey?: string): Observable<string> {
    const key = idempotencyKey || this.generateIdempotencyKey();
    const headers = new HttpHeaders({ 'Idempotency-Key': key });

    return this.http.post<ApiResponse<string>>(this.apiUrl, command, { headers }).pipe(
      map(response => {
        if (response.data) {
          return response.data;
        }
        throw new Error('Falha ao criar pedido.');
      })
    );
  }

  getPedidoById(pedidoId: string): Observable<PedidoDetailsDto> {
    return this.http.get<ApiResponse<PedidoDetailsDto>>(`${this.apiUrl}/${pedidoId}`).pipe(
      map(response => {
        if (response.data) {
          return response.data;
        }
        throw new Error('Pedido não encontrado.');
      })
    );
  }

  private generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    // fallback simples
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
