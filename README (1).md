# Facilita Vagas

Plataforma para pesquisar vagas de emprego, filtrar os resultados e guardar as favoritas. As vagas vêm de uma API REST pública, então a lista é real e muda com o tempo.

Feito com JavaScript puro, HTML5 e CSS3.

## O que dá para fazer

- Buscar por cargo, empresa, cidade ou tecnologia
- Filtrar por modalidade (remoto ou presencial), tipo de contrato e tecnologia
- Ordenar por data, título ou empresa
- Ver os detalhes da vaga e ir para o link de candidatura
- Favoritar vagas e consultar todas elas na aba Favoritas

As favoritas ficam salvas no navegador (localStorage), sem login nem banco de dados.

## API

Os dados vêm da API pública do [Arbeitnow](https://www.arbeitnow.com/api/job-board-api), que não exige chave. A busca e os filtros são feitos no próprio navegador sobre as vagas já carregadas, e o botão "Carregar mais vagas" busca a próxima página da API.

Como é um quadro de vagas europeu, a maioria dos anúncios está em inglês ou alemão.

Se a API estiver fora do ar, a página avisa e mostra algumas vagas de exemplo no lugar.

## Como rodar

Baixe os arquivos e abra o `index.html` no navegador. Precisa de internet para buscar as vagas.

## Arquivos

- `index.html`: estrutura da página
- `style.css`: estilo e responsividade
- `script.js`: chamada à API, busca, filtros, favoritos e detalhes da vaga
