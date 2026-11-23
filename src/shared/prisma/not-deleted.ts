// Filtros do soft delete. Todo SELECT de atendimento, medicação, vacina e
// anexo usa um destes. Apagar o atendimento esconde também o que está nele.

// Atendimento que não foi apagado
export const LIVE = { deletedAt: null } as const

// Medicação e anexo: o registro e o atendimento dele estão vivos
export const LIVE_IN_VISIT = {
  deletedAt: null,
  visit: { deletedAt: null },
} as const

// A vacina pode não ter atendimento (vacina antiga). Sem atendimento, vale.
export const LIVE_VACCINE = {
  deletedAt: null,
  OR: [{ visitId: null }, { visit: { deletedAt: null } }],
}
