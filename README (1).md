facilita Vagas

plataforma para pesquisar vagas de emprego, filtrar os resultados e guardar as favoritas. as vagas vêm de uma API REST pública, então a lista é real e muda com o tempo.

feito com javascript puro, HTML5 e CSS3.

o que dá para fazer
 buscar por cargo, empresa, cidade ou tecnologia
 filtrar por modalidade (remoto ou presencial), tipo de contrato e tecnologia
 ordenar por data, título ou empresa
 ver os detalhes da vaga e ir para o link de candidatura
 favoritar vagas e consultar todas elas na aba Favoritas
as favoritas ficam salvas no navegador (localstorage), sem login nem banco de dados.

API
os dados vêm da API pública do [Arbeitnow](https://www.arbeitnow.com/api/job-board-api), que não exige chave. a busca e os filtros são feitos no próprio navegador sobre as vagas já carregadas, e o botão "Carregar mais vagas" busca a próxima página da API.
como é um quadro de vagas europeu, a maioria dos anúncios está em inglês.
se a API estiver fora do ar, a página avisa e mostra algumas vagas de exemplo no lugar.

como rodar
baixe os arquivos e abra o `index.html` no navegador. precisa de internet para buscar as vagas.

arquivos
- index.html: estrutura da página
- style.css: estilo e responsividade
- script.js: chamada à API, busca, filtros, favoritos e detalhes da vaga
