const FAQ_ITEMS = [
  {
    id: '1',
    question: 'Como criar um anúncio no Siamo?',
    answer:
      'Toque no botão "+" na barra inferior e siga os 5 passos: tipo de anúncio, categoria, descrição, preço e fotos. Seu anúncio ficará ativo imediatamente após a publicação.',
    category: 'anuncios',
  },
  {
    id: '2',
    question: 'Como funciona o sistema de matchmaking?',
    answer:
      'O Siamo analisa sua localização, especialidade e histórico para encontrar anúncios compatíveis. A aba "Matches" no feed mostra as melhores oportunidades para você, ordenadas por pontuação.',
    category: 'matchmaking',
  },
  {
    id: '3',
    question: 'Como entrar em contato com um anunciante?',
    answer:
      'Abra o anúncio de interesse e toque em "Fazer Proposta" ou "Entrar em Contato". Você poderá enviar uma proposta com valor e quantidade. O anunciante receberá uma notificação.',
    category: 'transacoes',
  },
  {
    id: '4',
    question: 'O que é o Selo de Reputação?',
    answer:
      'O Selo (Bronze, Prata ou Ouro) reflete sua confiabilidade na plataforma. É calculado com base nas avaliações recebidas, número de transações concluídas e tempo de resposta às propostas.',
    category: 'reputacao',
  },
  {
    id: '5',
    question: 'Como funciona o pagamento?',
    answer:
      'O Siamo facilita o acordo entre as partes, mas o pagamento é combinado diretamente entre produtor e prestador. Recomendamos formalizar o acordo por contrato escrito para segurança de ambos.',
    category: 'transacoes',
  },
  {
    id: '6',
    question: 'Posso usar o Siamo sem internet?',
    answer:
      'O app funciona em modo offline para consultar anúncios e contatos já carregados. Para publicar anúncios, enviar propostas ou receber notificações, é necessária conexão com a internet.',
    category: 'geral',
  },
  {
    id: '7',
    question: 'Como alterar minha localização?',
    answer:
      'Acesse Configurações > Conta > Localização. Você pode usar a localização atual do celular ou digitar manualmente a cidade e estado. A localização afeta os resultados de busca e matchmaking.',
    category: 'conta',
  },
  {
    id: '8',
    question: 'Como excluir minha conta?',
    answer:
      'Acesse Configurações > Privacidade e Segurança > Excluir conta. Seus dados serão removidos em até 30 dias conforme a LGPD. Transações em andamento serão encerradas.',
    category: 'conta',
  },
  {
    id: '9',
    question: 'Como desativar as notificações?',
    answer:
      'Acesse Configurações > Notificações para controlar quais tipos de notificação você recebe e por qual canal (WhatsApp ou push). Você pode desativar individualmente cada tipo.',
    category: 'notificacoes',
  },
  {
    id: '10',
    question: 'Como avaliar um prestador após a transação?',
    answer:
      'Ao marcar uma transação como concluída, o app solicita automaticamente sua avaliação. Você pode dar de 1 a 5 estrelas e deixar um comentário. Avaliações são públicas no perfil do prestador.',
    category: 'reputacao',
  },
]

export class HelpService {
  listFaq() {
    return FAQ_ITEMS
  }

  searchFaq(query: string) {
    const q = query.toLowerCase().trim()
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.category ?? '').includes(q),
    )
  }
}
