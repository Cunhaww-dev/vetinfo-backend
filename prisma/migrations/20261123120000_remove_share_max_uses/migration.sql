-- O código não tem mais limite de usos (decisão de 23/11/2026).
-- Os acessos continuam registrados em share_uses, para auditoria.
ALTER TABLE "shares" DROP COLUMN "max_uses";
