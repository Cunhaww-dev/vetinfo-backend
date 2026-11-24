// Filtros do soft delete. Todo SELECT de paciente, tutor, atendimento, medicação,
// vacina e anexo usa um destes. Apagar o paciente esconde tudo o que é dele, e
// apagar o atendimento esconde o que está nele.

// Registro que não foi apagado (paciente, tutor, medicação, anexo...)
export const LIVE = { deletedAt: null } as const

// Atendimento: ele e o paciente dele estão vivos
export const LIVE_VISIT = {
  deletedAt: null,
  patient: LIVE,
} as const

// Medicação e anexo: o registro e o atendimento dele estão vivos
export const LIVE_IN_VISIT = {
  deletedAt: null,
  visit: LIVE_VISIT,
} as const

// A vacina pode não ter atendimento (vacina antiga). Sem atendimento, vale.
export const LIVE_VACCINE = {
  deletedAt: null,
  patient: LIVE,
  OR: [{ visitId: null }, { visit: { deletedAt: null } }],
}
