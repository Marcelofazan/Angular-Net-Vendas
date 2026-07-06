export interface PessoaListItemDto {
  id: string;
  nome: string;
  email: string;
  cpfCnpj: string;
  dataCriacao: string;
}

export interface PessoaFormData {
  id?: string;
  nome: string;
  email: string;
  cpfCnpj: string;
}
