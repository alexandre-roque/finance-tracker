# Finance Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Índice

-   [Descrição](#descrição)
-   [Funcionalidades](#funcionalidades)
-   [Tecnologias Utilizadas](#tecnologias-utilizadas)
-   [Instalação](#instalação)
-   [Como Usar](#como-usar)
-   [Contribuição](#contribuição)
-   [Licença](#licença)
-   [Contato](#contato)

## Descrição

O **Finance Tracker** é uma aplicação web desenvolvida para ajudar as pessoas a organizarem suas finanças diárias. Com ele, você pode registrar suas despesas, receitas e ter um controle completo do seu orçamento de forma simples e intuitiva.

Você pode acessar o projeto online através do link abaixo:  
👉 [Finance Tracker](https://finance-tracker-roque.vercel.app/)

## Funcionalidades

-   Cadastro de despesas e receitas recorrentes e/ou pontuais
-   Categorias personalizáveis
-   Analytics
-   Gerenciamento de faturas
-   Visualização gráfica de dados
-   Separação de times e percentuais de contribuição
-   Exportação de dados

## Tecnologias Utilizadas

-   [Next.js](https://nextjs.org/) - Framework React para aplicações web
-   [Drizzle ORM](https://drizzle.team/) - ORM para TypeScript e JavaScript
-   [TursoDB](https://turso.tech/) - Banco de dados distribuído para aplicações modernas

## Instalação

1. Clone o repositório:

    ```bash
    git clone https://github.com/alexandre-roque/finance-tracker.git
    ```

2. Navegue até o diretório do projeto:

    ```bash
    cd finance-tracker
    ```

3. Instale as dependências:

    ```bash
    npm install
    ```

4. Configure as variáveis de ambiente. Crie um arquivo `.env.local` na raiz do projeto e adicione as seguintes variáveis:

    ```env
    AUTH_SECRET=<chave-secreta>
    TURSO_CONNECTION_URL=<sua_url_do_tursodb>
    TURSO_AUTH_TOKEN=<seu_token_do_tursodb>
    NEXTAUTH_URL=<url_do_projeto>
    ```

## Como Usar

1. Inicie o servidor de desenvolvimento:

    ```bash
    npm run dev
    ```

2. Abra o navegador e acesse [http://localhost:3000](http://localhost:3000).

3. Comece a cadastrar suas despesas e receitas e tenha controle total das suas finanças!

## Contribuição

Contribuições são bem-vindas! Siga os passos abaixo para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Dê commit em suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Faça o push para a branch (`git push origin feature/nome-da-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contato

-   **Alexandre Roque** - [alexandre.roque1313@gmail.com](mailto:alexandre.roque1313@gmail.com)
-   **GitHub**: [alexandre-roque](https://github.com/alexandre-roque)
