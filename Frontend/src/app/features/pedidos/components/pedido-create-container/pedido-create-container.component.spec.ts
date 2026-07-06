import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { PedidoCreateContainerComponent } from './pedido-create-container.component';
import { PedidoService } from '../../services/pedido.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { PessoaListItemDto } from '../../../../shared/models/pessoa-models';
import { ProdutoListItemDto } from '../../../../shared/models/api-models';

describe('PedidoCreateContainerComponent', () => {
  let pedidoService: jasmine.SpyObj<PedidoService>;
  let feedbackService: jasmine.SpyObj<FeedbackService>;

  const pessoa: PessoaListItemDto = {
    id: 'pessoa-1',
    nome: 'Cliente Teste',
    email: 'cliente@teste.com',
    cpfCnpj: '12345678900',
    dataCriacao: '2024-01-01T00:00:00Z'
  };

  const produto: ProdutoListItemDto = {
    id: 'produto-1',
    nome: 'Produto Teste',
    sku: 'SKU-001',
    preco: 99.9,
    estoque: 5,
    Ativo: true
  };

  beforeEach(async () => {
    pedidoService = jasmine.createSpyObj('PedidoService', ['createPedido']);
    feedbackService = jasmine.createSpyObj('FeedbackService', ['error', 'success', 'info', 'clear']);

    await TestBed.configureTestingModule({
      imports: [PedidoCreateContainerComponent, RouterTestingModule],
      providers: [
        { provide: PedidoService, useValue: pedidoService },
        { provide: FeedbackService, useValue: feedbackService }
      ]
    }).compileComponents();
  });

  function prepareValidPedido(component: PedidoCreateContainerComponent): void {
    component.onPessoaSelected(pessoa);
    component.onProdutoSelected(produto);
  }

  it('should submit a valid pedido and navigate to details', async () => {
    pedidoService.createPedido.and.returnValue(of('pedido-123'));

    const fixture = TestBed.createComponent(PedidoCreateContainerComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    fixture.detectChanges();
    prepareValidPedido(component);

    component.submitPedido();

    expect(pedidoService.createPedido).toHaveBeenCalledTimes(1);
    expect(pedidoService.createPedido).toHaveBeenCalledWith({
      pessoaId: pessoa.id,
      items: [{ produtoId: produto.id, quantidade: 1 }]
    });
    expect(feedbackService.success).toHaveBeenCalledWith(jasmine.stringMatching('pedido-123'));
    expect(navigateSpy).toHaveBeenCalledWith(['/pedidos', 'pedido-123']);
    expect(component.isSubmitting).toBeFalse();
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(PedidoCreateContainerComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    component.submitPedido();

    expect(pedidoService.createPedido).not.toHaveBeenCalled();
    expect(feedbackService.success).not.toHaveBeenCalled();
  });

  it('should show feedback when submission fails', () => {
    const submissionError = new Error('Falha ao criar pedido.');
    pedidoService.createPedido.and.returnValue(throwError(() => submissionError));

    const fixture = TestBed.createComponent(PedidoCreateContainerComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    prepareValidPedido(component);

    component.submitPedido();

    expect(pedidoService.createPedido).toHaveBeenCalled();
    expect(feedbackService.error).toHaveBeenCalledWith(submissionError.message);
    expect(component.isSubmitting).toBeFalse();
  });
});