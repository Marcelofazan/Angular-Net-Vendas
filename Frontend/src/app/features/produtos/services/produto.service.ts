// src/app/features/produtos/services/produto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { PagedResult, ApiResponse, ProdutoListItemDto, ListProdutosQuery } from '../../../shared/models/api-models';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private apiUrl = '/api/produtos';

  constructor(private http: HttpClient) {}

  // Requisição de Leitura (GET) usando o endpoint Dapper (ListProdutosQuery)
  listProdutos(query: ListProdutosQuery): Observable<PagedResult<ProdutoListItemDto>> {
    const normalizedQuery: ListProdutosQuery = {
      ...query,
      sortDirection: query.sortDirection ?? 'asc'
    };

    const shouldDefaultActive = normalizedQuery.Ativo === undefined && !normalizedQuery.skipIsActiveDefault;
    if (shouldDefaultActive) {
      normalizedQuery.Ativo = true;
    }
    if (normalizedQuery.skipIsActiveDefault !== undefined) {
      delete normalizedQuery.skipIsActiveDefault;
    }

    // Converte o objeto de query para HttpParams (para filtros, paginação, etc.)
    let params = new HttpParams();
    Object.keys(normalizedQuery).forEach(key => {
      if (key === 'skipIsActiveDefault') {
        return;
      }
      // Adiciona apenas valores definidos (ignora nulos)
      const value = (normalizedQuery as any)[key];
      if (value !== null && value !== undefined) {
        params = params.append(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<PagedResult<ProdutoListItemDto>>>(this.apiUrl, { params }).pipe(
      
      // Mapeia o resultado, ignorando o envelope (cod_retorno, mensagem)
      map(response => {
        if (!response.data) {
          throw new Error('Formato de resposta inválido.');
        }

        console.log('response.data', response.data);
        console.log('this.apiUrl', this.apiUrl);
        

        const items = response.data.items ?? [];
        const totalCount = response.data.totalCount ?? items.length;
        const fallbackPageSize = normalizedQuery.pageSize || response.data.pageSize || items.length || 1;
        const pageSize = response.data.pageSize ?? fallbackPageSize;
        const totalPages = response.data.totalPages ?? Math.max(1, Math.ceil(totalCount / (pageSize || 1)));
        const pageNumber = response.data.pageNumber ?? normalizedQuery.pageNumber ?? 1;

        return {
          ...response.data,
          items: items.map(item => this.ensureStockQty(item)),
          totalCount,
          pageSize,
          pageNumber,
          totalPages
        };
      })
    );
  }

  // Requisição de Escrita (POST) usando o endpoint EF Core
  createProduto(command: any): Observable<string> { // Retorna o ID
    const payload = this.normalizePayload(command);
    return this.http.post<ApiResponse<string>>(this.apiUrl, payload).pipe(
      map(response => {
        if (response.data) {
          return response.data;
        }
        throw new Error('Falha ao obter ID após criação.');
      })
    );
  }

  // Requisição de Atualização (PUT)
  updateProduto(id: string, command: any): Observable<void> {
    const payload = this.normalizePayload(command);
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}`, payload).pipe(
      map(() => undefined)
    );
  }

  // Requisição de Exclusão (DELETE)
  deleteProduto(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  // Valida duplicidade de SKU consultando o backend antes de criar/atualizar
  isSkuAvailable(sku: string, excludeProdutoId?: string): Observable<boolean> {
    const normalizedSku = (sku ?? '').trim().toUpperCase();
    if (!normalizedSku) {
      return of(false);
    }

    const lookupQuery: ListProdutosQuery = {
      pageNumber: 1,
      pageSize: 25,
      orderBy: 'sku',
      searchTerm: normalizedSku,
      skipIsActiveDefault: true
    };

    return this.listProdutos(lookupQuery).pipe(
      map(result => {
        const existing = result.items.find(item => (item.sku ?? '').trim().toUpperCase() === normalizedSku);
        if (!existing) {
          return true;
        }

        if (excludeProdutoId && existing.id === excludeProdutoId) {
          return true;
        }

        return false;
      })
    );
  }

  // Buscar produto por ID (GET)
  getProdutoById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.ensureStockQty(response.data))
    );
  }

  private ensureStockQty<T extends { [key: string]: any }>(produto: T): T & { estoque: number } {
    const estoqueQuantidade = (produto && (produto['estoque'] ?? produto['estoqueQuantidade'] ?? produto['stock'])) ?? 0;
    return {
      ...produto,
      estoque: Number.isFinite(estoqueQuantidade) ? Number(estoqueQuantidade) : 0
    };
  }

  private normalizePayload(command: any) {
    const estoque = Number(command?.estoque ?? command?.estoqueQuantidade ?? command?.stock ?? 0);
    const preco = Number(command?.preco ?? 0);
    const Ativo = command?.Ativo ?? true;

    return {
      ...command,
      preco,
      estoque,
      estoqueQuantidade: estoque,
      Ativo
    };
  }
}