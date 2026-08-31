import { DomainError } from "../../../../shared/errors/domain-error.ts";

export class CrmvRequiredForProfessional extends DomainError {
   readonly code = 'CRMV_REQUIRED_FOR_PROFESSIONAL';

   constructor(){
      super('CRMV is required for professional users');
   }
}