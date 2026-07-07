## 🌐 Angular-Vendas-Api10-EF
Exemplo de projeto CQRS-like de Vendas com Serilog e idempotência em C# ASP.NET Core 10 e Angular 17 e com banco de dados Postgres. 

#### 🎨 Aqui está uma demonstração do projeto
<img width="700" height="350" alt="Angular" src="https://github.com/user-attachments/assets/e486eafe-fcb6-4884-8d3f-663dd80e796e" />


#### 💬 Requisitos do Projeto
- Realizar Migrations EntityFramework .NET

#### ⚠️ String de conexão do banco 
Modifique a string de conexão no arquivo **appsettings.json**, no trecho indicado:
```bash
 "DefaultConnection": "Host=localhost;Port=5432;Database=vendas_db;Username=postgres;Password=[SUA_SENHA]"
```

## 📁 Backend
#### 📋 O que voçê vai ver nesse Projeto
| Tecnologia | Descrição |
|-----------|-----------|
| **Idempotência**  | Garantia de segurança, confiabilidade e consistência em sistemas, especialmente em cenários de falhas de rede |
| **Paginação** | Dividir grandes volumes de dados em partes menores (páginas), melhorando o desempenho, evitando timeouts e economia de recursos | 
| **Seed** | Dados populados iniciais ou de teste automaticamente. |
| **Serilog** | Biblioteca para registro de logs em aplicações de monitorar o comportamento da aplicação |


#### 🔄 Executar a aplicação
VSCode Terminal [1]
```bash
cd Backend
cd exemploAPIVendas
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools
cd..
dotnet build
dotnet ef migrations add BancoInicial --project InfraEstrutura/InfraEstrutura.csproj --startup-project exemploAPIVendas/exemploAPIVendas.csproj
dotnet ef database update --startup-project exemploAPIVendas/exemploAPIVendas.csproj
cd exemploAPIVendas
dotnet run
```
A API fica disponivel em **http://localhost:5000/scalar/v1**

#### 🔍 Executar Testes Unitários
VSCode Terminal [2]
```bash
cd Backend
dotnet test exemploAPIVendas.Testes/exemploAPIVendas.Testes.csproj
```

#### ➡️ Fluxo de uma Requisição
```
Angular Form
   └─► HTTP Request          (API)
        └─► ProductsController
             └─► CreateProductCommandHandler
                  └─► ProductRepository
                       └─► ApplicationDbContex
                            └─► PostgreSQL 
                                 └─► Response JSON para Frontend
```


#### Observabilidade & Correlation ID
- Cada requisição recebe/propaga `X-Correlation-ID` via middleware ASP.NET Core e interceptor Angular. O header é exibido também no banner de feedback quando erros ocorrem.
- Serilog está configurado para Console (JSON) e arquivo (`logs/`). Use o correlation ID para rastrear requisições end-to-end.
  
## 📁 Frontend 

#### 📋 O que voçê vai ver nesse Projeto
| Tecnologia | Descrição |
|-----------|-----------|
| **Eslint**  | Ferramenta de análise estática de código (linter) para JavaScript e TypeScript |
| **Karma**  | Ferramenta de testes automatizados (test runner) para JavaScript e Angular. |
| **Jasmine**  | Framework padrão para a criação de testes unitários (testes de comportamento) |


#### 🔄 Executar a aplicação

VSCode Terminal [3]
```bash
cd Frontend
npm install -g @angular/cli
npm install
ng serve
```

Para acessar a aplicação **http://localhost:4200/**

- Estrutura relevante
- `src/app/features/orders` — fluxos de pedidos (criacao/list/details)
- `src/app/core/interceptors` — interceptors de envelope, erro e `X-Correlation-ID`
- `src/app/shared/components/feedback-banner` — banner global para mensagens e correlação

#### 🔍 Executar Testes Unitários
- Validação ESLint
- Modo interativo com Karma + Jasmine
- Mesma suíte em modo headless (usada nos scripts `scripts/verify.*`)

VSCode Terminal [4]
```bash
cd Frontend
npm run lint
npm run test
npm run test:ci
```
## 📁 scripts 
#### 🔍 Executar Testes Unitários
- Executar Testes script PowerShell
- 
VSCode Terminal [4]
```bash
cd scripts
.\verify.ps1
```

- Você pode pular etapas exportando `SkipBackendTests`, `SkipFrontendTests` ou `SkipFrontendTests` (ou passando os switches no PowerShell).
```bash
.\verify.ps1 -SkipBackendTests
.\verify.ps1 -SkipFrontendTests
.\verify.ps1 -SkipFrontendLint
```
- Executar Testes script Mac/Linux
```bash
./scripts/verify.sh
```

