import { DomainError } from "../../../../shared/errors/domain-error.ts";

export class InvalidCrmvFormat extends DomainError {
   readonly code = 'INVALID_CRMV_FORMAT';

   constructor(crmv: string){
      super(`CRMV ${crmv} has an invalid format`);
   }
}